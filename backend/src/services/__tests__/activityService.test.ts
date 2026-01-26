import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActivityService } from '../activityService.js';
import { ActivityStatus, UserRole } from '@prisma/client';
import { prisma } from '../../utils/prisma.js';
import { objectiveService } from '../objectiveService.js';

// Mock dependencies
vi.mock('../../utils/prisma.js', () => ({
  prisma: {
    activity: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    investmentObjective: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../objectiveService.js', () => ({
  objectiveService: {
    recomputeObjectiveSpend: vi.fn(),
  },
}));

describe('ActivityService', () => {
  let activityService: ActivityService;

  beforeEach(() => {
    activityService = new ActivityService();
    vi.clearAllMocks();
  });

  describe('createActivity', () => {
    it('should create activity with valid data', async () => {
      const mockObjective = {
        id: 'obj-123',
        title: 'Test Objective',
      };

      const mockActivity = {
        id: 'activity-123',
        sn: 1,
        investmentObjectiveId: 'obj-123',
        title: 'Test Activity',
        descriptionAndObjective: 'Description',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: ActivityStatus.Planned,
        progressPercent: 0,
        lead: 'John Doe',
        estimatedSpendUsdTotal: 50000,
        annualEstimates: { '2024': 50000 },
        riskRating: 'Medium',
        priority: 'High',
        createdById: 'user-123',
        createdAt: new Date(),
        updatedById: null,
        updatedAt: new Date(),
        deletedAt: null,
        lockedById: null,
        lockedAt: null,
        actualSpendUsdTotal: 0,
      };

      vi.mocked(prisma.investmentObjective.findUnique).mockResolvedValue(mockObjective as any);
      vi.mocked(prisma.activity.create).mockResolvedValue(mockActivity);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);
      vi.mocked(objectiveService.recomputeObjectiveSpend).mockResolvedValue();

      const result = await activityService.createActivity(
        {
          investmentObjectiveId: 'obj-123',
          title: 'Test Activity',
          estimatedSpendUsdTotal: 50000,
          annualEstimates: { '2024': 50000 },
        },
        'user-123',
        UserRole.ProjectManager
      );

      expect(result.id).toBe('activity-123');
      expect(prisma.activity.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
      expect(objectiveService.recomputeObjectiveSpend).toHaveBeenCalledWith(
        'obj-123'
      );
    });

    it('should validate annual estimates sum matches total', async () => {
      const mockObjective = {
        id: 'obj-123',
        title: 'Test Objective',
      };

      const mockActivity = {
        id: 'activity-123',
        sn: 1,
        investmentObjectiveId: 'obj-123',
        title: 'Test Activity',
        descriptionAndObjective: null,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-12-31'),
        status: ActivityStatus.Planned,
        progressPercent: 0,
        lead: null,
        estimatedSpendUsdTotal: 100000,
        annualEstimates: { '2024': 50000, '2025': 50000 },
        riskRating: null,
        priority: null,
        createdById: 'user-123',
        createdAt: new Date(),
        updatedById: null,
        updatedAt: new Date(),
        deletedAt: null,
        lockedById: null,
        lockedAt: null,
        actualSpendUsdTotal: 0,
      };

      vi.mocked(prisma.investmentObjective.findUnique).mockResolvedValue(mockObjective as any);
      vi.mocked(prisma.activity.create).mockResolvedValue(mockActivity);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);
      vi.mocked(objectiveService.recomputeObjectiveSpend).mockResolvedValue();

      const result = await activityService.createActivity(
        {
          investmentObjectiveId: 'obj-123',
          title: 'Test Activity',
          estimatedSpendUsdTotal: 100000,
          annualEstimates: { '2024': 50000, '2025': 50000 },
        },
        'user-123',
        UserRole.ProjectManager
      );

      expect(result).toBeDefined();
      expect(prisma.activity.create).toHaveBeenCalled();
    });

    it('should throw error when annual estimates sum does not match total', async () => {
      await expect(
        activityService.createActivity(
          {
            investmentObjectiveId: 'obj-123',
            title: 'Test Activity',
            estimatedSpendUsdTotal: 100000,
            annualEstimates: { '2024': 40000, '2025': 50000 }, // Sum = 90000, not 100000
          },
          'user-123',
          UserRole.ProjectManager
        )
      ).rejects.toThrow();
    });
  });

  describe('updateActivity', () => {
    it('should update activity when user holds lock', async () => {
      const mockActivity = {
        id: 'activity-123',
        sn: 1,
        investmentObjectiveId: 'obj-123',
        title: 'Original Title',
        descriptionAndObjective: null,
        startDate: new Date(),
        endDate: new Date(),
        status: ActivityStatus.Planned,
        progressPercent: 0,
        lead: null,
        estimatedSpendUsdTotal: 50000,
        annualEstimates: {},
        riskRating: null,
        priority: null,
        createdById: 'user-123',
        createdAt: new Date(),
        updatedById: null,
        updatedAt: new Date(),
        deletedAt: null,
        lockedById: 'user-123', // Locked by same user
        lockedAt: new Date(),
        actualSpendUsdTotal: 0,
      };

      const updatedActivity = {
        ...mockActivity,
        title: 'Updated Title',
        lockedById: null,
        lockedAt: null,
      };

      vi.mocked(prisma.activity.findUnique).mockResolvedValue(mockActivity);
      vi.mocked(prisma.activity.update).mockResolvedValue(updatedActivity);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);
      vi.mocked(objectiveService.recomputeObjectiveSpend).mockResolvedValue();

      const result = await activityService.updateActivity(
        'activity-123',
        { title: 'Updated Title' },
        'user-123',
        UserRole.ProjectManager
      );

      expect(result.title).toBe('Updated Title');
      expect(result.lockedById).toBeNull();
      expect(prisma.activity.update).toHaveBeenCalled();
    });

    it('should throw error when activity is locked by another user', async () => {
      const mockActivity = {
        id: 'activity-123',
        sn: 1,
        investmentObjectiveId: 'obj-123',
        title: 'Original Title',
        descriptionAndObjective: null,
        startDate: new Date(),
        endDate: new Date(),
        status: ActivityStatus.Planned,
        progressPercent: 0,
        lead: null,
        estimatedSpendUsdTotal: 50000,
        annualEstimates: {},
        riskRating: null,
        priority: null,
        createdById: 'user-123',
        createdAt: new Date(),
        updatedById: null,
        updatedAt: new Date(),
        deletedAt: null,
        lockedById: 'other-user', // Locked by different user
        lockedAt: new Date(),
        actualSpendUsdTotal: 0,
      };

      vi.mocked(prisma.activity.findUnique).mockResolvedValue(mockActivity);

      await expect(
        activityService.updateActivity(
          'activity-123',
          { title: 'Updated Title' },
          'user-123',
          UserRole.ProjectManager
        )
      ).rejects.toThrow();
    });

    it('should validate annual estimates on update', async () => {
      const mockActivity = {
        id: 'activity-123',
        sn: 1,
        investmentObjectiveId: 'obj-123',
        title: 'Test Activity',
        descriptionAndObjective: null,
        startDate: new Date(),
        endDate: new Date(),
        status: ActivityStatus.Planned,
        progressPercent: 0,
        lead: null,
        estimatedSpendUsdTotal: 50000,
        annualEstimates: { '2024': 50000 },
        riskRating: null,
        priority: null,
        createdById: 'user-123',
        createdAt: new Date(),
        updatedById: null,
        updatedAt: new Date(),
        deletedAt: null,
        lockedById: 'user-123',
        lockedAt: new Date(),
        actualSpendUsdTotal: 0,
      };

      vi.mocked(prisma.activity.findUnique).mockResolvedValue(mockActivity);

      await expect(
        activityService.updateActivity(
          'activity-123',
          {
            estimatedSpendUsdTotal: 100000,
            annualEstimates: { '2024': 40000, '2025': 50000 }, // Sum = 90000
          },
          'user-123',
          UserRole.ProjectManager
        )
      ).rejects.toThrow();
    });
  });

  describe('deleteActivity', () => {
    it('should soft delete activity', async () => {
      const mockActivity = {
        id: 'activity-123',
        sn: 1,
        investmentObjectiveId: 'obj-123',
        title: 'Test Activity',
        descriptionAndObjective: null,
        startDate: new Date(),
        endDate: new Date(),
        status: ActivityStatus.Planned,
        progressPercent: 0,
        lead: null,
        estimatedSpendUsdTotal: 50000,
        annualEstimates: {},
        riskRating: null,
        priority: null,
        createdById: 'user-123',
        createdAt: new Date(),
        updatedById: null,
        updatedAt: new Date(),
        deletedAt: null,
        lockedById: null,
        lockedAt: null,
        actualSpendUsdTotal: 0,
      };

      vi.mocked(prisma.activity.findUnique).mockResolvedValue(mockActivity);
      vi.mocked(prisma.activity.update).mockResolvedValue({} as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);
      vi.mocked(objectiveService.recomputeObjectiveSpend).mockResolvedValue();

      // deleteActivity returns void
      await activityService.deleteActivity(
        'activity-123',
        'user-123',
        UserRole.Admin
      );

      expect(prisma.activity.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'activity-123' },
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
          }),
        })
      );
      expect(prisma.auditLog.create).toHaveBeenCalled();
      expect(objectiveService.recomputeObjectiveSpend).toHaveBeenCalledWith('obj-123');
    });
  });

  describe('Locking Mechanism', () => {
    describe('lockActivity', () => {
      it('should acquire lock when activity is unlocked', async () => {
        const mockActivity = {
          id: 'activity-123',
          sn: 1,
          investmentObjectiveId: 'obj-123',
          title: 'Test Activity',
          descriptionAndObjective: null,
          startDate: new Date(),
          endDate: new Date(),
          status: ActivityStatus.Planned,
          progressPercent: 0,
          lead: null,
          estimatedSpendUsdTotal: 50000,
          annualEstimates: {},
          riskRating: null,
          priority: null,
          createdById: 'user-123',
          createdAt: new Date(),
          updatedById: null,
          updatedAt: new Date(),
          deletedAt: null,
          lockedById: null, // Unlocked
          lockedAt: null,
          lockedBy: null,
          actualSpendUsdTotal: 0,
        };

        vi.mocked(prisma.activity.findUnique).mockResolvedValue(mockActivity as any);
        vi.mocked(prisma.activity.update).mockResolvedValue({} as any);

        const result = await activityService.lockActivity(
          'activity-123',
          'user-123'
        );

        // Implementation returns { lockedBy: userId, lockedAt, expiresAt }
        expect(result.lockedBy).toBe('user-123');
        expect(result.lockedAt).toBeDefined();
        expect(result.expiresAt).toBeDefined();
      });

      it('should throw error when activity is already locked by another user', async () => {
        const mockActivity = {
          id: 'activity-123',
          sn: 1,
          investmentObjectiveId: 'obj-123',
          title: 'Test Activity',
          descriptionAndObjective: null,
          startDate: new Date(),
          endDate: new Date(),
          status: ActivityStatus.Planned,
          progressPercent: 0,
          lead: null,
          estimatedSpendUsdTotal: 50000,
          annualEstimates: {},
          riskRating: null,
          priority: null,
          createdById: 'user-123',
          createdAt: new Date(),
          updatedById: null,
          updatedAt: new Date(),
          deletedAt: null,
          lockedById: 'other-user',
          lockedAt: new Date(),
          actualSpendUsdTotal: 0,
        };

        vi.mocked(prisma.activity.findUnique).mockResolvedValue(mockActivity);

        await expect(
          activityService.lockActivity('activity-123', 'user-123')
        ).rejects.toThrow();
      });

      it('should allow same user to re-acquire lock', async () => {
        const mockActivity = {
          id: 'activity-123',
          sn: 1,
          investmentObjectiveId: 'obj-123',
          title: 'Test Activity',
          descriptionAndObjective: null,
          startDate: new Date(),
          endDate: new Date(),
          status: ActivityStatus.Planned,
          progressPercent: 0,
          lead: null,
          estimatedSpendUsdTotal: 50000,
          annualEstimates: {},
          riskRating: null,
          priority: null,
          createdById: 'user-123',
          createdAt: new Date(),
          updatedById: null,
          updatedAt: new Date(),
          deletedAt: null,
          lockedById: 'user-123', // Already locked by same user
          lockedAt: new Date(),
          lockedBy: { id: 'user-123', fullName: 'Test User', email: 'test@example.com' },
          actualSpendUsdTotal: 0,
        };

        vi.mocked(prisma.activity.findUnique).mockResolvedValue(mockActivity as any);
        vi.mocked(prisma.activity.update).mockResolvedValue({} as any);

        const result = await activityService.lockActivity(
          'activity-123',
          'user-123'
        );

        // Implementation returns { lockedBy: userId, lockedAt, expiresAt }
        expect(result.lockedBy).toBe('user-123');
      });
    });

    describe('unlockActivity', () => {
      it('should release lock when user holds it', async () => {
        const mockActivity = {
          id: 'activity-123',
          sn: 1,
          investmentObjectiveId: 'obj-123',
          title: 'Test Activity',
          descriptionAndObjective: null,
          startDate: new Date(),
          endDate: new Date(),
          status: ActivityStatus.Planned,
          progressPercent: 0,
          lead: null,
          estimatedSpendUsdTotal: 50000,
          annualEstimates: {},
          riskRating: null,
          priority: null,
          createdById: 'user-123',
          createdAt: new Date(),
          updatedById: null,
          updatedAt: new Date(),
          deletedAt: null,
          lockedById: 'user-123',
          lockedAt: new Date(),
          actualSpendUsdTotal: 0,
        };

        vi.mocked(prisma.activity.findUnique).mockResolvedValue(mockActivity);
        vi.mocked(prisma.activity.update).mockResolvedValue({} as any);

        // unlockActivity returns void
        await activityService.unlockActivity(
          'activity-123',
          'user-123'
        );

        expect(prisma.activity.update).toHaveBeenCalledWith({
          where: { id: 'activity-123' },
          data: {
            lockedById: null,
            lockedAt: null,
          },
        });
      });

      it('should throw error when trying to unlock another user\'s lock', async () => {
        const mockActivity = {
          id: 'activity-123',
          sn: 1,
          investmentObjectiveId: 'obj-123',
          title: 'Test Activity',
          descriptionAndObjective: null,
          startDate: new Date(),
          endDate: new Date(),
          status: ActivityStatus.Planned,
          progressPercent: 0,
          lead: null,
          estimatedSpendUsdTotal: 50000,
          annualEstimates: {},
          riskRating: null,
          priority: null,
          createdById: 'user-123',
          createdAt: new Date(),
          updatedById: null,
          updatedAt: new Date(),
          deletedAt: null,
          lockedById: 'other-user',
          lockedAt: new Date(),
          actualSpendUsdTotal: 0,
        };

        vi.mocked(prisma.activity.findUnique).mockResolvedValue(mockActivity);

        await expect(
          activityService.unlockActivity('activity-123', 'user-123')
        ).rejects.toThrow();
      });
    });

    describe('getLockStatus', () => {
      it('should return lock status for locked activity', async () => {
        const lockDate = new Date();
        const mockActivity = {
          id: 'activity-123',
          sn: 1,
          lockedById: 'user-123',
          lockedAt: lockDate,
          lockedBy: {
            id: 'user-123',
            fullName: 'John Doe',
            email: 'john@example.com',
          },
        };

        vi.mocked(prisma.activity.findUnique).mockResolvedValue(mockActivity as any);

        const result = await activityService.getLockStatus('activity-123');

        expect(result.isLocked).toBe(true);
        // Implementation returns lockedBy as string (userId) and lockedByUser as object
        expect(result.lockedBy).toBe('user-123');
        expect(result.lockedByUser).toEqual({
          id: 'user-123',
          fullName: 'John Doe',
          email: 'john@example.com',
        });
        expect(result.lockedAt).toEqual(lockDate);
      });

      it('should return unlocked status for unlocked activity', async () => {
        const mockActivity = {
          id: 'activity-123',
          sn: 1,
          lockedById: null,
          lockedAt: null,
          lockedBy: null,
        };

        vi.mocked(prisma.activity.findUnique).mockResolvedValue(mockActivity as any);

        const result = await activityService.getLockStatus('activity-123');

        expect(result.isLocked).toBe(false);
        expect(result.lockedBy).toBeNull();
      });
    });

    describe('cleanupExpiredLocks', () => {
      it('should release expired locks', async () => {
        vi.mocked(prisma.activity.updateMany).mockResolvedValue({ count: 3 });

        const result = await activityService.cleanupExpiredLocks();

        // Implementation returns result.count directly (a number)
        expect(result).toBe(3);
        expect(prisma.activity.updateMany).toHaveBeenCalledWith({
          where: {
            lockedById: { not: null },
            lockedAt: { lt: expect.any(Date) },
          },
          data: {
            lockedById: null,
            lockedAt: null,
          },
        });
      });
    });
  });

  describe('getActivities', () => {
    it('should return paginated activities with filters', async () => {
      const mockActivities = [
        {
          id: 'activity-1',
          sn: 1,
          title: 'Activity 1',
          status: ActivityStatus.Planned,
          lockedById: null,
          investmentObjective: {
            id: 'obj-123',
            title: 'Objective 1',
          },
        },
        {
          id: 'activity-2',
          sn: 2,
          title: 'Activity 2',
          status: ActivityStatus.InProgress,
          lockedById: null,
          investmentObjective: {
            id: 'obj-123',
            title: 'Objective 1',
          },
        },
      ];

      vi.mocked(prisma.activity.findMany).mockResolvedValue(mockActivities as any);
      vi.mocked(prisma.activity.count).mockResolvedValue(2);

      const result = await activityService.getActivities({
        investmentObjectiveId: 'obj-123',
        page: 1,
        limit: 10,
      });

      // Implementation returns { activities, pagination: { page, limit, total, totalPages } }
      expect(result.activities).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
  });
});
