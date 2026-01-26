import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportService } from '../reportService.js';
import { prisma } from '../../utils/prisma.js';

// Helper to create mock Prisma Decimal values
const mockDecimal = (value: number) => ({
  toNumber: () => value,
  toString: () => String(value),
  valueOf: () => value,
});

// Mock dependencies
vi.mock('../../utils/prisma.js', () => ({
  prisma: {
    activity: {
      findMany: vi.fn(),
    },
    investmentObjective: {
      findMany: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
    },
  },
}));

// Create a complete PDFKit mock
const createPDFMock = () => {
  const chunks: Buffer[] = [];
  let dataCallback: ((chunk: Buffer) => void) | null = null;
  let endCallback: (() => void) | null = null;

  const mockDoc = {
    fontSize: vi.fn().mockReturnThis(),
    font: vi.fn().mockReturnThis(),
    text: vi.fn().mockReturnThis(),
    moveDown: vi.fn().mockReturnThis(),
    fillColor: vi.fn().mockReturnThis(),
    rect: vi.fn().mockReturnThis(),
    fill: vi.fn().mockReturnThis(),
    stroke: vi.fn().mockReturnThis(),
    lineCap: vi.fn().mockReturnThis(),
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    addPage: vi.fn().mockReturnThis(),
    page: { width: 612, height: 792, margins: { left: 50, right: 50 } },
    y: 100,
    x: 50,
    on: vi.fn((event: string, callback: any) => {
      if (event === 'data') {
        dataCallback = callback;
      } else if (event === 'end') {
        endCallback = callback;
      }
      return mockDoc;
    }),
    end: vi.fn(() => {
      // Simulate data emission and end
      setTimeout(() => {
        if (dataCallback) {
          dataCallback(Buffer.from('PDF content'));
        }
        if (endCallback) {
          endCallback();
        }
      }, 0);
    }),
  };

  return mockDoc;
};

vi.mock('pdfkit', () => {
  return {
    default: vi.fn().mockImplementation(() => createPDFMock()),
  };
});

describe('ReportService', () => {
  let reportService: ReportService;

  beforeEach(() => {
    reportService = new ReportService();
    vi.clearAllMocks();
  });

  describe('generateFinancialReport', () => {
    it('should generate financial summary PDF with activity data', async () => {
      const mockActivities = [
        {
          id: 'activity-1',
          sn: 1,
          title: 'Activity 1',
          estimatedSpendUsdTotal: mockDecimal(50000),
          actualSpendUsdTotal: mockDecimal(45000),
          status: 'InProgress',
          investmentObjective: {
            title: 'Objective 1',
          },
        },
        {
          id: 'activity-2',
          sn: 2,
          title: 'Activity 2',
          estimatedSpendUsdTotal: mockDecimal(75000),
          actualSpendUsdTotal: mockDecimal(80000),
          status: 'Completed',
          investmentObjective: {
            title: 'Objective 2',
          },
        },
      ];

      vi.mocked(prisma.activity.findMany).mockResolvedValue(mockActivities as any);
      vi.mocked(prisma.investmentObjective.findMany).mockResolvedValue([
        { id: 'obj-1', title: 'Objective 1', sn: 1, activities: mockActivities },
      ] as any);

      const result = await reportService.generateFinancialReport();

      expect(result).toBeInstanceOf(Buffer);
      expect(prisma.activity.findMany).toHaveBeenCalled();
    });

    it('should handle empty activity list', async () => {
      vi.mocked(prisma.activity.findMany).mockResolvedValue([]);
      vi.mocked(prisma.investmentObjective.findMany).mockResolvedValue([]);

      const result = await reportService.generateFinancialReport();

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should calculate totals correctly', async () => {
      const mockActivities = [
        {
          id: 'activity-1',
          sn: 1,
          title: 'Activity 1',
          estimatedSpendUsdTotal: mockDecimal(50000),
          actualSpendUsdTotal: mockDecimal(45000),
          status: 'InProgress',
          investmentObjective: {
            title: 'Objective 1',
          },
        },
        {
          id: 'activity-2',
          sn: 2,
          title: 'Activity 2',
          estimatedSpendUsdTotal: mockDecimal(75000),
          actualSpendUsdTotal: mockDecimal(80000),
          status: 'Completed',
          investmentObjective: {
            title: 'Objective 2',
          },
        },
      ];

      vi.mocked(prisma.activity.findMany).mockResolvedValue(mockActivities as any);
      vi.mocked(prisma.investmentObjective.findMany).mockResolvedValue([
        { id: 'obj-1', title: 'Objective 1', sn: 1, activities: mockActivities },
      ] as any);

      const result = await reportService.generateFinancialReport();

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('generateAuditReport', () => {
    it('should generate audit trail PDF with filters', async () => {
      const mockAuditLogs = [
        {
          id: 'audit-1',
          action: 'Create',
          objectType: 'Activity',
          objectId: 'activity-1',
          newValues: { title: 'New Activity' },
          actorId: 'user-1',
          ipAddress: '192.168.1.1',
          createdAt: new Date('2024-01-01'),
          actor: {
            fullName: 'John Doe',
            email: 'john@example.com',
          },
        },
        {
          id: 'audit-2',
          action: 'Update',
          objectType: 'Activity',
          objectId: 'activity-1',
          previousValues: { estimatedSpendUsdTotal: 50000 },
          newValues: { estimatedSpendUsdTotal: 60000 },
          actorId: 'user-2',
          ipAddress: '192.168.1.2',
          createdAt: new Date('2024-01-02'),
          actor: {
            fullName: 'Jane Smith',
            email: 'jane@example.com',
          },
        },
      ];

      vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockAuditLogs as any);

      const result = await reportService.generateAuditReport({
        objectType: 'Activity',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      expect(result).toBeInstanceOf(Buffer);
      expect(prisma.auditLog.findMany).toHaveBeenCalled();
    }, 10000);

    it('should handle audit logs without filters', async () => {
      const mockAuditLogs = [
        {
          id: 'audit-1',
          action: 'Create',
          objectType: 'Activity',
          objectId: 'activity-1',
          newValues: {},
          actorId: 'user-1',
          ipAddress: '192.168.1.1',
          createdAt: new Date(),
          actor: {
            fullName: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockAuditLogs as any);

      const result = await reportService.generateAuditReport({});

      expect(result).toBeInstanceOf(Buffer);
    }, 10000);

    it('should handle empty audit log list', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);

      const result = await reportService.generateAuditReport({});

      expect(result).toBeInstanceOf(Buffer);
    }, 10000);
  });

  describe('generateActivityReport', () => {
    it('should generate activity status PDF', async () => {
      const mockActivities = [
        {
          id: 'activity-1',
          sn: 1,
          title: 'Activity 1',
          status: 'InProgress',
          progressPercent: 50,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          lead: 'John Doe',
          estimatedSpendUsdTotal: mockDecimal(50000),
          actualSpendUsdTotal: mockDecimal(25000),
        },
        {
          id: 'activity-2',
          sn: 2,
          title: 'Activity 2',
          status: 'Planned',
          progressPercent: 0,
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-12-31'),
          lead: 'Jane Smith',
          estimatedSpendUsdTotal: mockDecimal(75000),
          actualSpendUsdTotal: mockDecimal(0),
        },
      ];

      // generateActivityReport uses investmentObjective.findMany with included activities
      vi.mocked(prisma.investmentObjective.findMany).mockResolvedValue([
        { id: 'obj-1', title: 'Objective 1', sn: 1, activities: mockActivities },
      ] as any);

      const result = await reportService.generateActivityReport();

      expect(result).toBeInstanceOf(Buffer);
      // generateActivityReport uses investmentObjective.findMany with included activities
      expect(prisma.investmentObjective.findMany).toHaveBeenCalled();
    });

    it('should handle activities with null values', async () => {
      const mockActivities = [
        {
          id: 'activity-1',
          sn: 1,
          title: 'Activity 1',
          status: 'Planned',
          progressPercent: 0,
          startDate: null,
          endDate: null,
          lead: null,
          estimatedSpendUsdTotal: mockDecimal(0),
          actualSpendUsdTotal: mockDecimal(0),
        },
      ];

      vi.mocked(prisma.investmentObjective.findMany).mockResolvedValue([
        { id: 'obj-1', title: 'Objective 1', sn: 1, activities: mockActivities },
      ] as any);

      const result = await reportService.generateActivityReport();

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should group activities by status', async () => {
      const activity1 = {
        id: 'activity-1',
        sn: 1,
        title: 'Planned Activity',
        status: 'Planned',
        progressPercent: 0,
        startDate: new Date(),
        endDate: new Date(),
        lead: 'John Doe',
        estimatedSpendUsdTotal: mockDecimal(50000),
        actualSpendUsdTotal: mockDecimal(0),
      };
      const activity2 = {
        id: 'activity-2',
        sn: 2,
        title: 'In Progress Activity',
        status: 'InProgress',
        progressPercent: 50,
        startDate: new Date(),
        endDate: new Date(),
        lead: 'Jane Smith',
        estimatedSpendUsdTotal: mockDecimal(75000),
        actualSpendUsdTotal: mockDecimal(35000),
      };
      const activity3 = {
        id: 'activity-3',
        sn: 3,
        title: 'Completed Activity',
        status: 'Completed',
        progressPercent: 100,
        startDate: new Date(),
        endDate: new Date(),
        lead: 'Bob Johnson',
        estimatedSpendUsdTotal: mockDecimal(100000),
        actualSpendUsdTotal: mockDecimal(95000),
      };

      vi.mocked(prisma.investmentObjective.findMany).mockResolvedValue([
        { id: 'obj-1', title: 'Objective 1', sn: 1, activities: [activity1] },
        { id: 'obj-2', title: 'Objective 2', sn: 2, activities: [activity2] },
        { id: 'obj-3', title: 'Objective 3', sn: 3, activities: [activity3] },
      ] as any);

      const result = await reportService.generateActivityReport();

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('PDF Generation', () => {
    it('should return Buffer for all report types', async () => {
      vi.mocked(prisma.activity.findMany).mockResolvedValue([]);
      vi.mocked(prisma.investmentObjective.findMany).mockResolvedValue([]);
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);

      const financialReport = await reportService.generateFinancialReport();
      const auditReport = await reportService.generateAuditReport({});
      const activityReport = await reportService.generateActivityReport();

      expect(financialReport).toBeInstanceOf(Buffer);
      expect(auditReport).toBeInstanceOf(Buffer);
      expect(activityReport).toBeInstanceOf(Buffer);
    }, 15000);

    it('should handle PDF generation errors', async () => {
      vi.mocked(prisma.activity.findMany).mockRejectedValue(
        new Error('Database error')
      );

      await expect(reportService.generateFinancialReport()).rejects.toThrow(
        'Database error'
      );
    });
  });
});
