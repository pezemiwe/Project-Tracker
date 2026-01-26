import { prisma } from "../utils/prisma.js";

export class DashboardService {
  async getKPIs() {
    const [activities, approvals] = await Promise.all([
      prisma.activity.findMany({
        where: { deletedAt: null },
        select: {
          estimatedSpendUsdTotal: true,
          actualSpendUsdTotal: true,
          status: true,
        },
      }),
      prisma.approval.groupBy({
        by: ["currentState"],
        _count: true,
      }),
    ]);

    const totalEstimated = activities.reduce(
      (sum, a) => sum + (a.estimatedSpendUsdTotal?.toNumber() || 0),
      0
    );
    const totalActual = activities.reduce(
      (sum, a) => sum + (a.actualSpendUsdTotal?.toNumber() || 0),
      0
    );
    const variance = totalActual - totalEstimated;

    const statusCounts = activities.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const overBudgetCount = activities.filter(
      (a) =>
        (a.actualSpendUsdTotal?.toNumber() || 0) >
        (a.estimatedSpendUsdTotal?.toNumber() || 0)
    ).length;

    return {
      totalEstimated,
      totalActual,
      variance,
      variancePercent:
        totalEstimated > 0 ? (variance / totalEstimated) * 100 : 0,
      activeActivities: statusCounts["InProgress"] || 0,
      completedActivities: statusCounts["Completed"] || 0,
      plannedActivities: statusCounts["Planned"] || 0,
      pendingApprovals:
        approvals.find((a) => a.currentState === "Submitted")?._count || 0,
      overBudgetCount,
    };
  }

  async getSpendByYear() {
    const activities = await prisma.activity.findMany({
      where: { deletedAt: null },
      select: {
        annualEstimates: true,
        actualSpendUsdTotal: true,
      },
    });

    const yearMap = new Map<number, { estimated: number; actual: number }>();

    activities.forEach((activity) => {
      const estimates = activity.annualEstimates as Record<string, number>;
      Object.entries(estimates || {}).forEach(([year, amount]) => {
        const y = parseInt(year);
        const existing = yearMap.get(y) || { estimated: 0, actual: 0 };
        existing.estimated += amount;
        yearMap.set(y, existing);
      });
    });

    return Array.from(yearMap.entries())
      .map(([year, data]) => ({
        year,
        estimated: data.estimated,
        actual: data.actual,
        variance: data.actual - data.estimated,
      }))
      .sort((a, b) => a.year - b.year);
  }

  async getVarianceAlerts(limit: number = 5) {
    const activities = await prisma.activity.findMany({
      where: {
        deletedAt: null,
        actualSpendUsdTotal: { gt: 0 },
      },
      select: {
        id: true,
        sn: true,
        title: true,
        estimatedSpendUsdTotal: true,
        actualSpendUsdTotal: true,
      },
    });

    return activities
      .map((a) => {
        const estimated = a.estimatedSpendUsdTotal?.toNumber() || 0;
        const actual = a.actualSpendUsdTotal?.toNumber() || 0;
        const variance = actual - estimated;
        return {
          activityId: a.id,
          activitySn: a.sn,
          activityTitle: a.title,
          estimated,
          actual,
          variance,
          variancePercent: estimated > 0 ? (variance / estimated) * 100 : 0,
        };
      })
      .filter((a) => a.variance > 0)
      .sort((a, b) => b.variance - a.variance)
      .slice(0, limit);
  }

  async getGanttData(filters?: { startYear?: number; endYear?: number }) {
    const where: any = { deletedAt: null };

    if (filters?.startYear || filters?.endYear) {
      where.AND = [];
      if (filters.startYear) {
        where.AND.push({
          startDate: { gte: new Date(`${filters.startYear}-01-01`) },
        });
      }
      if (filters.endYear) {
        where.AND.push({
          endDate: { lte: new Date(`${filters.endYear}-12-31`) },
        });
      }
    }

    const activities = await prisma.activity.findMany({
      where,
      select: {
        id: true,
        sn: true,
        title: true,
        startDate: true,
        endDate: true,
        progressPercent: true,
        status: true,
        investmentObjective: {
          select: { title: true },
        },
      },
      orderBy: { startDate: "asc" },
    });

    return activities.map((a) => ({
      id: a.id,
      sn: a.sn,
      title: a.title,
      startDate: a.startDate,
      endDate: a.endDate,
      progress: a.progressPercent,
      status: a.status,
      objectiveTitle: a.investmentObjective.title,
    }));
  }

  async getSpendAnalysis() {
    const [activities, actuals] = await Promise.all([
      prisma.activity.findMany({
        where: { deletedAt: null },
        include: {
          investmentObjective: {
            select: { regions: true },
          },
        },
      }),
      prisma.actual.findMany({
        where: { deletedAt: null },
        select: {
          category: true,
          amountUsd: true,
        },
      }),
    ]);

    // Spend by Region
    const regionMap = new Map<string, { estimated: number; actual: number }>();
    activities.forEach((a) => {
      const regions = a.investmentObjective.regions || [];
      if (regions.length === 0) {
        const existing = regionMap.get("Unknown") || { estimated: 0, actual: 0 };
        existing.estimated += a.estimatedSpendUsdTotal?.toNumber() || 0;
        existing.actual += a.actualSpendUsdTotal?.toNumber() || 0;
        regionMap.set("Unknown", existing);
      } else {
        regions.forEach((region) => {
          const existing = regionMap.get(region) || { estimated: 0, actual: 0 };
          // Note: Attributing full amount to each region for "coverage" reporting
          // Alternatively, we could divide by regions.length
          existing.estimated += a.estimatedSpendUsdTotal?.toNumber() || 0;
          existing.actual += a.actualSpendUsdTotal?.toNumber() || 0;
          regionMap.set(region, existing);
        });
      }
    });

    // Spend by Status
    const statusMap = new Map<string, { estimated: number; actual: number }>();
    activities.forEach((a) => {
      const status = a.status;
      const existing = statusMap.get(status) || { estimated: 0, actual: 0 };
      existing.estimated += a.estimatedSpendUsdTotal?.toNumber() || 0;
      existing.actual += a.actualSpendUsdTotal?.toNumber() || 0;
      statusMap.set(status, existing);
    });

    // Spend by Category
    const categoryMap = new Map<string, number>();
    actuals.forEach((a) => {
      const category = a.category;
      const existing = categoryMap.get(category) || 0;
      categoryMap.set(category, existing + a.amountUsd.toNumber());
    });

    return {
      byRegion: Array.from(regionMap.entries()).map(([name, data]) => ({
        name,
        ...data,
      })),
      byStatus: Array.from(statusMap.entries()).map(([name, data]) => ({
        name,
        ...data,
      })),
      byCategory: Array.from(categoryMap.entries()).map(([name, value]) => ({
        name,
        value,
      })),
    };
  }
}

export const dashboardService = new DashboardService();
