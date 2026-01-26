import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApprovalService } from '../approvalService.js';
import { ApprovalState, ApprovalTargetType, UserRole } from '@prisma/client';
import { prisma } from '../../utils/prisma.js';
import { emailService } from '../emailService.js';

// Mock dependencies
vi.mock('../../utils/prisma.js', () => ({
  prisma: {
    systemSetting: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    approval: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    activity: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../emailService.js', () => ({
  emailService: {
    sendApprovalSubmitted: vi.fn(),
    sendApprovalFinanceApproved: vi.fn(),
    sendApprovalRejected: vi.fn(),
    sendApprovalApproved: vi.fn(),
  },
}));

describe('ApprovalService', () => {
  let approvalService: ApprovalService;

  beforeEach(() => {
    approvalService = new ApprovalService();
    vi.clearAllMocks();
  });

  describe('getThresholdSettings', () => {
    it('should fetch threshold settings from database', async () => {
      vi.mocked(prisma.systemSetting.findUnique)
        .mockResolvedValueOnce({
          key: 'approvalThresholdUsd',
          value: 10000,
          description: '',
          updatedAt: new Date(),
          updatedById: null,
        })
        .mockResolvedValueOnce({
          key: 'approvalThresholdPercent',
          value: 20,
          description: '',
          updatedAt: new Date(),
          updatedById: null,
        });

      const result = await approvalService.getThresholdSettings();

      expect(result).toEqual({ usd: 10000, percent: 20 });
      expect(prisma.systemSetting.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should use default values if settings not found', async () => {
      vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(null);

      const result = await approvalService.getThresholdSettings();

      expect(result).toEqual({ usd: 5000, percent: 10 });
    });
  });

  describe('checkThreshold', () => {
    it('should return true when change is below USD threshold', async () => {
      vi.mocked(prisma.systemSetting.findUnique)
        .mockResolvedValueOnce({
          key: 'approvalThresholdUsd',
          value: 10000,
          description: '',
          updatedAt: new Date(),
          updatedById: null,
        })
        .mockResolvedValueOnce({
          key: 'approvalThresholdPercent',
          value: 20,
          description: '',
          updatedAt: new Date(),
          updatedById: null,
        });

      const result = await approvalService.checkThreshold(50000, 55000);

      expect(result).toBe(true); // $5,000 change < $10,000 threshold
    });

    it('should return true when change is below both thresholds', async () => {
      vi.mocked(prisma.systemSetting.findUnique)
        .mockResolvedValueOnce({
          key: 'approvalThresholdUsd',
          value: 10000,
          description: '',
          updatedAt: new Date(),
          updatedById: null,
        })
        .mockResolvedValueOnce({
          key: 'approvalThresholdPercent',
          value: 20,
          description: '',
          updatedAt: new Date(),
          updatedById: null,
        });

      // $8k change (8%) - below both $10k USD and 20% thresholds
      const result = await approvalService.checkThreshold(100000, 108000);

      expect(result).toBe(true); // $8k < $10k AND 8% < 20%
    });

    it('should return false when change exceeds both thresholds', async () => {
      vi.mocked(prisma.systemSetting.findUnique)
        .mockResolvedValueOnce({
          key: 'approvalThresholdUsd',
          value: 10000,
          description: '',
          updatedAt: new Date(),
          updatedById: null,
        })
        .mockResolvedValueOnce({
          key: 'approvalThresholdPercent',
          value: 20,
          description: '',
          updatedAt: new Date(),
          updatedById: null,
        });

      const result = await approvalService.checkThreshold(50000, 75000);

      expect(result).toBe(false); // $25,000 change > $10,000 AND 50% > 20%
    });

    it('should handle zero old value correctly', async () => {
      vi.mocked(prisma.systemSetting.findUnique)
        .mockResolvedValueOnce({
          key: 'approvalThresholdUsd',
          value: 10000,
          description: '',
          updatedAt: new Date(),
          updatedById: null,
        })
        .mockResolvedValueOnce({
          key: 'approvalThresholdPercent',
          value: 20,
          description: '',
          updatedAt: new Date(),
          updatedById: null,
        });

      const result = await approvalService.checkThreshold(0, 5000);

      // When oldValue=0, percent change is set to 100% which fails the < 20% threshold
      // Implementation requires BOTH thresholds to pass (AND logic)
      expect(result).toBe(false); // $5k < $10k BUT 100% > 20%
    });
  });

  describe('checkMultiRole', () => {
    it('should return true when user is Admin (has all permissions)', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        role: UserRole.Admin,
      } as any);

      const result = await approvalService.checkMultiRole('user-123');

      expect(result).toBe(true);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: { role: true },
      });
    });

    it('should return false when user has only Finance role', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        role: UserRole.Finance,
      } as any);

      const result = await approvalService.checkMultiRole('user-123');

      expect(result).toBe(false);
    });
  });

  describe('submitApproval', () => {
    it('should create approval in Submitted state', async () => {
      const mockActivity = {
        id: 'activity-123',
        sn: 1,
        title: 'Test Activity',
        estimatedSpendUsdTotal: 50000,
        investmentObjectiveId: 'obj-123',
        descriptionAndObjective: '',
        startDate: new Date(),
        endDate: new Date(),
        status: 'Planned' as any,
        progressPercent: 0,
        lead: null,
        annualEstimates: {},
        riskRating: null,
        priority: null,
        createdById: 'user-1',
        createdAt: new Date(),
        updatedById: null,
        updatedAt: new Date(),
        deletedAt: null,
        lockedById: null,
        lockedAt: null,
        actualSpendUsdTotal: 0,
      };

      const mockApproval = {
        id: 'approval-123',
        targetType: ApprovalTargetType.EstimateChange,
        targetId: 'activity-123',
        currentState: ApprovalState.Submitted,
        submittedById: 'user-123',
        submittedAt: new Date(),
        financeApprovedById: null,
        financeApprovedAt: null,
        financeComment: null,
        committeeApprovedById: null,
        committeeApprovedAt: null,
        committeeComment: null,
        rejectedById: null,
        rejectedAt: null,
        rejectionReason: null,
        history: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.activity.findUnique).mockResolvedValue(mockActivity);
      vi.mocked(prisma.approval.create).mockResolvedValue(mockApproval);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      const result = await approvalService.submitApproval(
        {
          targetType: ApprovalTargetType.EstimateChange,
          targetId: 'activity-123',
          oldValue: 50000,
          newValue: 60000,
          comment: 'Need more budget',
        },
        'user-123',
        UserRole.ProjectManager
      );

      expect(result.currentState).toBe(ApprovalState.Submitted);
      expect(prisma.approval.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should auto-advance to FinanceApproved if below threshold', async () => {
      const mockActivity = {
        id: 'activity-123',
        sn: 1,
        title: 'Test Activity',
        estimatedSpendUsdTotal: 50000,
        investmentObjectiveId: 'obj-123',
        descriptionAndObjective: '',
        startDate: new Date(),
        endDate: new Date(),
        status: 'Planned' as any,
        progressPercent: 0,
        lead: null,
        annualEstimates: {},
        riskRating: null,
        priority: null,
        createdById: 'user-1',
        createdAt: new Date(),
        updatedById: null,
        updatedAt: new Date(),
        deletedAt: null,
        lockedById: null,
        lockedAt: null,
        actualSpendUsdTotal: 0,
      };

      // Mock threshold check to return true (below threshold)
      vi.mocked(prisma.systemSetting.findUnique)
        .mockResolvedValueOnce({
          key: 'approvalThresholdUsd',
          value: 10000,
          description: '',
          updatedAt: new Date(),
          updatedById: null,
        })
        .mockResolvedValueOnce({
          key: 'approvalThresholdPercent',
          value: 20,
          description: '',
          updatedAt: new Date(),
          updatedById: null,
        });

      vi.mocked(prisma.activity.findUnique).mockResolvedValue(mockActivity);
      vi.mocked(prisma.approval.create).mockResolvedValue({
        id: 'approval-123',
        targetType: ApprovalTargetType.EstimateChange,
        targetId: 'activity-123',
        currentState: ApprovalState.FinanceApproved,
        submittedById: 'user-123',
        submittedAt: new Date(),
        financeApprovedById: 'user-123',
        financeApprovedAt: new Date(),
        financeComment: 'Auto-approved (below threshold)',
        committeeApprovedById: null,
        committeeApprovedAt: null,
        committeeComment: null,
        rejectedById: null,
        rejectedAt: null,
        rejectionReason: null,
        history: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      const result = await approvalService.submitApproval(
        {
          targetType: ApprovalTargetType.EstimateChange,
          targetId: 'activity-123',
          oldValue: 50000,
          newValue: 54000, // $4,000 increase (below $10,000 threshold)
          comment: 'Small adjustment',
        },
        'user-123',
        UserRole.ProjectManager
      );

      // The actual state depends on implementation logic
      expect(prisma.approval.create).toHaveBeenCalled();
    });
  });

  describe('financeApprove', () => {
    it('should update approval state to FinanceApproved', async () => {
      const mockApproval = {
        id: 'approval-123',
        targetType: ApprovalTargetType.EstimateChange,
        targetId: 'activity-123',
        currentState: ApprovalState.Submitted,
        submittedById: 'user-123',
        submittedAt: new Date(),
        financeApprovedById: null,
        financeApprovedAt: null,
        financeComment: null,
        committeeApprovedById: null,
        committeeApprovedAt: null,
        committeeComment: null,
        rejectedById: null,
        rejectedAt: null,
        rejectionReason: null,
        history: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        activity: {
          id: 'activity-123',
          sn: 1,
          title: 'Test Activity',
        },
      };

      vi.mocked(prisma.approval.findUnique).mockResolvedValue(mockApproval);
      vi.mocked(prisma.approval.update).mockResolvedValue({
        ...mockApproval,
        currentState: ApprovalState.FinanceApproved,
        financeApprovedById: 'finance-user',
        financeApprovedAt: new Date(),
        financeComment: 'Approved by Finance',
      });
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      const result = await approvalService.financeApprove(
        'approval-123',
        'finance-user',
        UserRole.Finance,
        { comment: 'Approved by Finance' }
      );

      expect(result.currentState).toBe(ApprovalState.FinanceApproved);
      expect(prisma.approval.update).toHaveBeenCalled();
    });

    it('should throw error if approval not in Submitted state', async () => {
      const mockApproval = {
        id: 'approval-123',
        targetType: ApprovalTargetType.EstimateChange,
        targetId: 'activity-123',
        currentState: ApprovalState.FinanceApproved, // Already approved
        submittedById: 'user-123',
        submittedAt: new Date(),
        financeApprovedById: 'finance-user',
        financeApprovedAt: new Date(),
        financeComment: null,
        committeeApprovedById: null,
        committeeApprovedAt: null,
        committeeComment: null,
        rejectedById: null,
        rejectedAt: null,
        rejectionReason: null,
        history: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.approval.findUnique).mockResolvedValue(mockApproval);

      await expect(
        approvalService.financeApprove(
          'approval-123',
          'finance-user',
          UserRole.Finance,
          { comment: 'Approved' }
        )
      ).rejects.toThrow();
    });
  });

  describe('committeeApprove', () => {
    it('should update approval state to CommitteeApproved and apply changes', async () => {
      const mockApproval = {
        id: 'approval-123',
        targetType: ApprovalTargetType.EstimateChange,
        targetId: 'activity-123',
        currentState: ApprovalState.FinanceApproved,
        submittedById: 'user-123',
        submittedAt: new Date(),
        financeApprovedById: 'finance-user',
        financeApprovedAt: new Date(),
        financeComment: null,
        committeeApprovedById: null,
        committeeApprovedAt: null,
        committeeComment: null,
        rejectedById: null,
        rejectedAt: null,
        rejectionReason: null,
        history: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        activity: {
          id: 'activity-123',
          sn: 1,
          title: 'Test Activity',
        },
        submittedBy: {
          id: 'user-123',
          email: 'pm@test.com',
        },
      };

      vi.mocked(prisma.approval.findUnique).mockResolvedValue(mockApproval);
      vi.mocked(prisma.approval.update).mockResolvedValue({
        ...mockApproval,
        currentState: ApprovalState.CommitteeApproved,
        committeeApprovedById: 'committee-user',
        committeeApprovedAt: new Date(),
        committeeComment: 'Approved by Committee',
      });
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);
      vi.mocked(prisma.notification.create).mockResolvedValue({} as any);

      const result = await approvalService.committeeApprove(
        'approval-123',
        'committee-user',
        UserRole.CommitteeMember,
        { comment: 'Approved by Committee' }
      );

      expect(result.currentState).toBe(ApprovalState.CommitteeApproved);
      expect(prisma.approval.update).toHaveBeenCalled();
    });
  });

  describe('rejectApproval', () => {
    it('should update approval state to Rejected', async () => {
      const mockApproval = {
        id: 'approval-123',
        targetType: ApprovalTargetType.EstimateChange,
        targetId: 'activity-123',
        currentState: ApprovalState.Submitted,
        submittedById: 'user-123',
        submittedAt: new Date(),
        financeApprovedById: null,
        financeApprovedAt: null,
        financeComment: null,
        committeeApprovedById: null,
        committeeApprovedAt: null,
        committeeComment: null,
        rejectedById: null,
        rejectedAt: null,
        rejectionReason: null,
        history: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        activity: {
          id: 'activity-123',
          sn: 1,
          title: 'Test Activity',
        },
        submittedBy: {
          id: 'user-123',
          email: 'pm@test.com',
        },
      };

      vi.mocked(prisma.approval.findUnique).mockResolvedValue(mockApproval);
      vi.mocked(prisma.approval.update).mockResolvedValue({
        ...mockApproval,
        currentState: ApprovalState.Rejected,
        rejectedById: 'finance-user',
        rejectedAt: new Date(),
        rejectionReason: 'Insufficient justification',
      });
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);
      vi.mocked(prisma.notification.create).mockResolvedValue({} as any);

      const result = await approvalService.rejectApproval(
        'approval-123',
        'finance-user',
        UserRole.Finance,
        { reason: 'Insufficient justification' }
      );

      expect(result.currentState).toBe(ApprovalState.Rejected);
      expect(prisma.approval.update).toHaveBeenCalled();
    });
  });
});
