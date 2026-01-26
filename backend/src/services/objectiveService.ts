import { UserRole } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { notificationService } from './notificationService.js';
import { STATE_TO_REGION } from '../utils/constants.js';

interface CreateObjectiveData {
  title: string;
  shortDescription?: string;
  longDescription?: string;
  states?: string[];
  tags?: string[];
  overallStartYear: number;
  overallEndYear: number;
  status?: string;
}

interface UpdateObjectiveData {
  title?: string;
  shortDescription?: string;
  longDescription?: string;
  states?: string[];
  tags?: string[];
  overallStartYear?: number;
  overallEndYear?: number;
  status?: string;
}

export class ObjectiveService {
  private getRegionsFromStates(states: string[]): string[] {
    const regions = new Set(states.map(state => STATE_TO_REGION[state]).filter(Boolean));
    return Array.from(regions);
  }

  async createObjective(
    data: CreateObjectiveData,
    createdById: string,
    createdByRole: UserRole,
    ipAddress?: string
  ) {
    const states = data.states || [];
    const regions = this.getRegionsFromStates(states);

    // Create objective
    const objective = await prisma.investmentObjective.create({
      data: {
        title: data.title,
        shortDescription: data.shortDescription,
        longDescription: data.longDescription,
        states,
        regions,
        tags: data.tags || [],
        overallStartYear: data.overallStartYear,
        overallEndYear: data.overallEndYear,
        status: data.status || 'Active',
        computedEstimatedSpendUsd: 0,
        createdById,
        updatedById: createdById,
      },
      select: {
        id: true,
        sn: true,
        title: true,
        shortDescription: true,
        longDescription: true,
        states: true,
        regions: true,
        tags: true,
        overallStartYear: true,
        overallEndYear: true,
        status: true,
        computedEstimatedSpendUsd: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: createdById,
        actorRole: createdByRole,
        action: 'Create',
        objectType: 'InvestmentObjective',
        objectId: objective.id,
        newValues: {
          title: objective.title,
          states: objective.states,
          regions: objective.regions,
          overallStartYear: objective.overallStartYear,
          overallEndYear: objective.overallEndYear,
        },
        ipAddress,
      },
    });

    // Notify relevant users about new objective
    await this.notifyNewObjective(objective.id, objective.title, createdById);

    return objective;
  }

  /**
   * Notify Finance and Committee users about new objective
   */
  private async notifyNewObjective(
    objectiveId: string,
    objectiveTitle: string,
    createdById: string
  ) {
    try {
      // Get creator's name
      const creator = await prisma.user.findUnique({
        where: { id: createdById },
        select: { fullName: true },
      });

      // Notify Finance and Committee users (excluding creator)
      const usersToNotify = await prisma.user.findMany({
        where: {
          role: { in: ['Finance', 'CommitteeMember', 'Admin'] },
          id: { not: createdById },
        },
        select: { id: true },
      });

      for (const user of usersToNotify) {
        await notificationService.createNotification({
          userId: user.id,
          type: 'ObjectiveCreated',
          title: 'New Investment Objective',
          message: `${creator?.fullName || 'A user'} created objective "${objectiveTitle}"`,
          link: `/objectives?objectiveId=${objectiveId}`,
        });
      }
    } catch (error) {
      console.error('Failed to send objective creation notifications:', error);
    }
  }

  async updateObjective(
    objectiveId: string,
    data: UpdateObjectiveData,
    updatedById: string,
    updatedByRole: UserRole,
    ipAddress?: string
  ) {
    // Get current objective state
    const currentObjective = await prisma.investmentObjective.findUnique({
      where: { id: objectiveId, deletedAt: null },
    });

    if (!currentObjective) {
      throw new Error('Objective not found');
    }

    const updateData: any = { ...data, updatedById };
    
    if (data.states) {
      updateData.regions = this.getRegionsFromStates(data.states);
    }

    // Update objective
    const objective = await prisma.investmentObjective.update({
      where: { id: objectiveId },
      data: updateData,
      select: {
        id: true,
        sn: true,
        title: true,
        shortDescription: true,
        longDescription: true,
        states: true,
        regions: true,
        tags: true,
        overallStartYear: true,
        overallEndYear: true,
        status: true,
        computedEstimatedSpendUsd: true,
        updatedAt: true,
      },
    });

    // Create audit log
    const previousValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};

    if (data.title && data.title !== currentObjective.title) {
      previousValues.title = currentObjective.title;
      newValues.title = data.title;
    }
    if (data.states && JSON.stringify(data.states) !== JSON.stringify(currentObjective.states)) {
      previousValues.states = currentObjective.states;
      newValues.states = data.states;
      previousValues.regions = currentObjective.regions;
      newValues.regions = updateData.regions;
    }
    if (data.status && data.status !== currentObjective.status) {
      previousValues.status = currentObjective.status;
      newValues.status = data.status;
    }
    if (data.overallStartYear && data.overallStartYear !== currentObjective.overallStartYear) {
      previousValues.overallStartYear = currentObjective.overallStartYear;
      newValues.overallStartYear = data.overallStartYear;
    }
    if (data.overallEndYear && data.overallEndYear !== currentObjective.overallEndYear) {
      previousValues.overallEndYear = currentObjective.overallEndYear;
      newValues.overallEndYear = data.overallEndYear;
    }

    await prisma.auditLog.create({
      data: {
        actorId: updatedById,
        actorRole: updatedByRole,
        action: 'Update',
        objectType: 'InvestmentObjective',
        objectId: objective.id,
        previousValues,
        newValues,
        ipAddress,
      },
    });

    return objective;
  }

  async deleteObjective(
    objectiveId: string,
    deletedById: string,
    deletedByRole: UserRole,
    ipAddress?: string
  ) {
    const objective = await prisma.investmentObjective.findUnique({
      where: { id: objectiveId, deletedAt: null },
    });

    if (!objective) {
      throw new Error('Objective not found');
    }

    // Soft delete objective and cascade to activities
    await prisma.$transaction(async (tx) => {
      // Soft delete objective
      await tx.investmentObjective.update({
        where: { id: objectiveId },
        data: {
          deletedAt: new Date(),
          updatedById: deletedById,
        },
      });

      // Soft delete all activities
      await tx.activity.updateMany({
        where: {
          investmentObjectiveId: objectiveId,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
          updatedById: deletedById,
        },
      });
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: deletedById,
        actorRole: deletedByRole,
        action: 'Delete',
        objectType: 'InvestmentObjective',
        objectId: objectiveId,
        comment: 'Soft delete with cascade to activities',
        ipAddress,
      },
    });
  }

  async getObjectives(filters: {
    status?: string;
    region?: string;
    state?: string;
    startYear?: number;
    endYear?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { status, region, state, startYear, endYear, page = 1, limit = 20, sortBy = 'sn', sortOrder = 'desc' } = filters;

    const where: any = { deletedAt: null };
    if (status) where.status = status;
    if (region) where.regions = { has: region };
    if (state) where.states = { has: state };
    if (startYear) where.overallStartYear = { gte: startYear };
    if (endYear) where.overallEndYear = { lte: endYear };

    // Build orderBy
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    }

    const [objectives, total] = await Promise.all([
      prisma.investmentObjective.findMany({
        where,
        select: {
          id: true,
          sn: true,
          title: true,
          shortDescription: true,
          states: true,
          regions: true,
          tags: true,
          overallStartYear: true,
          overallEndYear: true,
          status: true,
          computedEstimatedSpendUsd: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              activities: {
                where: { deletedAt: null },
              },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      prisma.investmentObjective.count({ where }),
    ]);

    return {
      objectives: objectives.map((obj) => ({
        ...obj,
        activityCount: obj._count.activities,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getObjective(objectiveId: string) {
    const objective = await prisma.investmentObjective.findUnique({
      where: { id: objectiveId, deletedAt: null },
      select: {
        id: true,
        sn: true,
        title: true,
        shortDescription: true,
        longDescription: true,
        states: true,
        regions: true,
        tags: true,
        overallStartYear: true,
        overallEndYear: true,
        status: true,
        computedEstimatedSpendUsd: true,
        createdAt: true,
        updatedAt: true,
        activities: {
          where: { deletedAt: null },
          select: {
            id: true,
            sn: true,
            title: true,
            status: true,
            startDate: true,
            endDate: true,
            lead: true,
            estimatedSpendUsdTotal: true,
          },
          orderBy: { sn: 'asc' },
        },
      },
    });

    if (!objective) {
      throw new Error('Objective not found');
    }

    return objective;
  }

  async recomputeObjectiveSpend(objectiveId: string) {
    const activities = await prisma.activity.findMany({
      where: {
        investmentObjectiveId: objectiveId,
        deletedAt: null,
      },
      select: {
        estimatedSpendUsdTotal: true,
      },
    });

    const totalEstimated = activities.reduce((sum, activity) => {
      return sum + (activity.estimatedSpendUsdTotal?.toNumber() || 0);
    }, 0);

    await prisma.investmentObjective.update({
      where: { id: objectiveId },
      data: {
        computedEstimatedSpendUsd: totalEstimated,
      },
    });
  }

  async getObjectiveAggregates(objectiveId: string) {
    // Verify objective exists
    const objective = await prisma.investmentObjective.findUnique({
      where: { id: objectiveId, deletedAt: null },
      select: {
        id: true,
        title: true,
      },
    });

    if (!objective) {
      throw new Error('Objective not found');
    }

    // Get all activities for objective
    const activities = await prisma.activity.findMany({
      where: {
        investmentObjectiveId: objectiveId,
        deletedAt: null,
      },
      select: {
        annualEstimates: true,
      },
    });

    // Calculate per-year estimates
    const perYearEstimates: Record<string, number> = {};

    activities.forEach((activity) => {
      const annualEstimates = activity.annualEstimates as Record<string, number> | null;
      if (annualEstimates) {
        Object.entries(annualEstimates).forEach(([year, amount]) => {
          perYearEstimates[year] = (perYearEstimates[year] || 0) + amount;
        });
      }
    });

    return {
      objectiveId,
      objectiveTitle: objective.title,
      perYearEstimates,
    };
  }
}

export const objectiveService = new ObjectiveService();
