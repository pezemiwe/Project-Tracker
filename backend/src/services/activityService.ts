import { UserRole, ActivityStatus } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { objectiveService } from "./objectiveService.js";
import { notificationService } from "./notificationService.js";

const LOCK_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

interface CreateActivityData {
  investmentObjectiveId: string;
  title: string;
  descriptionAndObjective?: string;
  startDate?: Date;
  endDate?: Date;
  status?: ActivityStatus;
  progressPercent?: number;
  lead?: string;
  estimatedSpendUsdTotal?: number;
  annualEstimates?: Record<string, number>;
  riskRating?: string;
  priority?: string;
}

interface UpdateActivityData {
  title?: string;
  descriptionAndObjective?: string;
  startDate?: Date;
  endDate?: Date;
  status?: ActivityStatus;
  progressPercent?: number;
  lead?: string;
  estimatedSpendUsdTotal?: number;
  annualEstimates?: Record<string, number>;
  riskRating?: string;
  priority?: string;
}

export class ActivityService {
  async createActivity(
    data: CreateActivityData,
    createdById: string,
    createdByRole: UserRole,
    ipAddress?: string,
  ) {
    // Verify objective exists
    const objective = await prisma.investmentObjective.findUnique({
      where: { id: data.investmentObjectiveId, deletedAt: null },
    });

    if (!objective) {
      throw new Error("Investment objective not found");
    }

    // Validate annual estimates
    if (data.annualEstimates && Object.keys(data.annualEstimates).length > 0) {
      const sum = Object.values(data.annualEstimates).reduce(
        (a, b) => a + b,
        0,
      );
      const total = data.estimatedSpendUsdTotal || 0;

      if (Math.abs(sum - total) > 0.01) {
        throw new Error("Annual estimates must equal total estimated spend");
      }
    }

    // Create activity
    const activity = await prisma.activity.create({
      data: {
        investmentObjectiveId: data.investmentObjectiveId,
        title: data.title,
        descriptionAndObjective: data.descriptionAndObjective,
        startDate: data.startDate!,
        endDate: data.endDate!,
        status: data.status || "Planned",
        progressPercent: data.progressPercent || 0,
        lead: data.lead,
        estimatedSpendUsdTotal: data.estimatedSpendUsdTotal,
        annualEstimates: data.annualEstimates || {},
        riskRating: data.riskRating,
        priority: data.priority,
        createdById,
        updatedById: createdById,
      },
      select: {
        id: true,
        sn: true,
        investmentObjectiveId: true,
        title: true,
        descriptionAndObjective: true,
        startDate: true,
        endDate: true,
        status: true,
        progressPercent: true,
        lead: true,
        estimatedSpendUsdTotal: true,
        riskRating: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Recompute objective's estimated spend
    await objectiveService.recomputeObjectiveSpend(data.investmentObjectiveId);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: createdById,
        actorRole: createdByRole,
        action: "Create",
        objectType: "Activity",
        objectId: activity.id,
        newValues: {
          title: activity.title,
          investmentObjectiveId: activity.investmentObjectiveId,
          status: activity.status,
        },
        ipAddress,
      },
    });

    // Notify relevant users about new activity
    await this.notifyNewActivity(
      activity.id,
      activity.title,
      objective.title,
      createdById,
    );

    return activity;
  }

  /**
   * Notify Finance and Committee users about new activity
   */
  private async notifyNewActivity(
    activityId: string,
    activityTitle: string,
    objectiveTitle: string,
    createdById: string,
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
          role: { in: ["Finance", "CommitteeMember", "Admin"] },
          id: { not: createdById },
        },
        select: { id: true },
      });

      for (const user of usersToNotify) {
        await notificationService.createNotification({
          userId: user.id,
          type: "ActivityCreated",
          title: "New Activity Created",
          message: `${creator?.fullName || "A user"} created activity "${activityTitle}" under "${objectiveTitle}"`,
          link: `/activities?activityId=${activityId}`,
        });
      }
    } catch (error) {
      console.error("Failed to send activity creation notifications:", error);
    }
  }

  async updateActivity(
    activityId: string,
    data: UpdateActivityData,
    updatedById: string,
    updatedByRole: UserRole,
    ipAddress?: string,
  ) {
    // Get current activity
    const currentActivity = await prisma.activity.findUnique({
      where: { id: activityId, deletedAt: null },
    });

    if (!currentActivity) {
      throw new Error("Activity not found");
    }

    // Check if user holds the lock
    if (
      currentActivity.lockedById &&
      currentActivity.lockedById !== updatedById
    ) {
      throw new Error("Activity is locked by another user");
    }

    // Validate annual estimates
    if (data.annualEstimates !== undefined) {
      const sum = Object.values(data.annualEstimates).reduce(
        (a, b) => a + b,
        0,
      );
      const total =
        data.estimatedSpendUsdTotal !== undefined
          ? data.estimatedSpendUsdTotal
          : currentActivity.estimatedSpendUsdTotal?.toNumber() || 0;

      if (Math.abs(sum - total) > 0.01) {
        throw new Error("Annual estimates must equal total estimated spend");
      }
    }

    // Update activity
    const activity = await prisma.activity.update({
      where: { id: activityId },
      data: {
        ...data,
        updatedById,
      },
      select: {
        id: true,
        sn: true,
        investmentObjectiveId: true,
        title: true,
        descriptionAndObjective: true,
        startDate: true,
        endDate: true,
        status: true,
        progressPercent: true,
        lead: true,
        estimatedSpendUsdTotal: true,
        riskRating: true,
        priority: true,
        updatedAt: true,
      },
    });

    // Recompute objective's estimated spend if amount changed
    if (data.estimatedSpendUsdTotal !== undefined) {
      await objectiveService.recomputeObjectiveSpend(
        currentActivity.investmentObjectiveId,
      );
    }

    // Create audit log
    const previousValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};

    if (data.title && data.title !== currentActivity.title) {
      previousValues.title = currentActivity.title;
      newValues.title = data.title;
    }
    if (data.status && data.status !== currentActivity.status) {
      previousValues.status = currentActivity.status;
      newValues.status = data.status;
    }
    if (data.estimatedSpendUsdTotal !== undefined) {
      previousValues.estimatedSpendUsdTotal =
        currentActivity.estimatedSpendUsdTotal?.toNumber();
      newValues.estimatedSpendUsdTotal = data.estimatedSpendUsdTotal;
    }
    if (data.annualEstimates !== undefined) {
      previousValues.annualEstimates = currentActivity.annualEstimates;
      newValues.annualEstimates = data.annualEstimates;
    }

    await prisma.auditLog.create({
      data: {
        actorId: updatedById,
        actorRole: updatedByRole,
        action: "Update",
        objectType: "Activity",
        objectId: activity.id,
        previousValues,
        newValues,
        ipAddress,
      },
    });

    return activity;
  }

  async deleteActivity(
    activityId: string,
    deletedById: string,
    deletedByRole: UserRole,
    ipAddress?: string,
  ) {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, deletedAt: null },
    });

    if (!activity) {
      throw new Error("Activity not found");
    }

    // Soft delete activity
    await prisma.activity.update({
      where: { id: activityId },
      data: {
        deletedAt: new Date(),
        updatedById: deletedById,
      },
    });

    // Recompute objective's estimated spend
    await objectiveService.recomputeObjectiveSpend(
      activity.investmentObjectiveId,
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: deletedById,
        actorRole: deletedByRole,
        action: "Delete",
        objectType: "Activity",
        objectId: activityId,
        ipAddress,
      },
    });
  }

  async lockActivity(activityId: string, userId: string) {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, deletedAt: null },
      include: {
        lockedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!activity) {
      throw new Error("Activity not found");
    }

    // Check if already locked
    if (activity.lockedById && activity.lockedById !== userId) {
      // Check if lock expired
      const lockAge = Date.now() - (activity.lockedAt?.getTime() || 0);
      if (lockAge < LOCK_TIMEOUT_MS) {
        throw new Error(
          `Activity is locked by ${activity.lockedBy?.fullName || "another user"}`,
        );
      }
    }

    // Acquire lock
    const lockedAt = new Date();
    await prisma.activity.update({
      where: { id: activityId },
      data: {
        lockedById: userId,
        lockedAt,
      },
    });

    return {
      lockedBy: userId,
      lockedAt,
      expiresAt: new Date(lockedAt.getTime() + LOCK_TIMEOUT_MS),
    };
  }

  async unlockActivity(activityId: string, userId: string) {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, deletedAt: null },
    });

    if (!activity) {
      throw new Error("Activity not found");
    }

    // Only allow unlocking if user holds the lock or lock expired
    if (activity.lockedById && activity.lockedById !== userId) {
      const lockAge = Date.now() - (activity.lockedAt?.getTime() || 0);
      if (lockAge < LOCK_TIMEOUT_MS) {
        throw new Error("Cannot unlock activity locked by another user");
      }
    }

    // Release lock
    await prisma.activity.update({
      where: { id: activityId },
      data: {
        lockedById: null,
        lockedAt: null,
      },
    });
  }

  async getLockStatus(activityId: string) {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, deletedAt: null },
      select: {
        lockedById: true,
        lockedAt: true,
        lockedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!activity) {
      throw new Error("Activity not found");
    }

    if (!activity.lockedById || !activity.lockedAt) {
      return {
        isLocked: false,
        lockedBy: null,
        lockedAt: null,
        expiresAt: null,
        lockedByUser: null,
      };
    }

    // Check if lock expired
    const lockAge = Date.now() - activity.lockedAt.getTime();
    if (lockAge >= LOCK_TIMEOUT_MS) {
      return {
        isLocked: false,
        lockedBy: null,
        lockedAt: null,
        expiresAt: null,
        lockedByUser: null,
      };
    }

    return {
      isLocked: true,
      lockedBy: activity.lockedById,
      lockedAt: activity.lockedAt,
      expiresAt: new Date(activity.lockedAt.getTime() + LOCK_TIMEOUT_MS),
      lockedByUser: activity.lockedBy,
    };
  }

  async getActivities(filters: {
    investmentObjectiveId?: string;
    status?: ActivityStatus;
    lead?: string;
    startYear?: number;
    endYear?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const {
      investmentObjectiveId,
      status,
      lead,
      startYear,
      endYear,
      page = 1,
      limit = 50,
      sortBy = "sn",
      sortOrder = "asc",
    } = filters;

    const where: any = { deletedAt: null };
    if (investmentObjectiveId)
      where.investmentObjectiveId = investmentObjectiveId;
    if (status) where.status = status;
    if (lead) where.lead = { contains: lead, mode: "insensitive" };
    if (startYear || endYear) {
      where.startDate = {};
      if (startYear) where.startDate.gte = new Date(`${startYear}-01-01`);
      if (endYear) where.startDate.lte = new Date(`${endYear}-12-31`);
    }

    // Build orderBy
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        select: {
          id: true,
          sn: true,
          investmentObjectiveId: true,
          title: true,
          descriptionAndObjective: true,
          startDate: true,
          endDate: true,
          status: true,
          progressPercent: true,
          lead: true,
          estimatedSpendUsdTotal: true,
          riskRating: true,
          priority: true,
          lockedById: true,
          lockedAt: true,
          createdAt: true,
          updatedAt: true,
          investmentObjective: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      prisma.activity.count({ where }),
    ]);

    return {
      activities: activities.map((a) => ({ ...a, lockedBy: a.lockedById })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getActivity(activityId: string) {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, deletedAt: null },
      select: {
        id: true,
        sn: true,
        investmentObjectiveId: true,
        title: true,
        descriptionAndObjective: true,
        startDate: true,
        endDate: true,
        status: true,
        progressPercent: true,
        lead: true,
        estimatedSpendUsdTotal: true,
        annualEstimates: true,
        riskRating: true,
        priority: true,
        lockedById: true,
        lockedAt: true,
        createdAt: true,
        updatedAt: true,
        investmentObjective: {
          select: {
            id: true,
            title: true,
            regions: true,
          },
        },
        lockedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!activity) {
      throw new Error("Activity not found");
    }

    return {
      ...activity,
      lockedBy: activity.lockedById,
      lockedByUser: activity.lockedBy,
    };
  }

  async cleanupExpiredLocks() {
    const expiryDate = new Date(Date.now() - LOCK_TIMEOUT_MS);

    const result = await prisma.activity.updateMany({
      where: {
        lockedById: { not: null },
        lockedAt: { lt: expiryDate },
      },
      data: {
        lockedById: null,
        lockedAt: null,
      },
    });

    return result.count;
  }
}

export const activityService = new ActivityService();
