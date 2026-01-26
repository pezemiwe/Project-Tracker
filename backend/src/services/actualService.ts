import { prisma } from '../utils/prisma.js';
import { UserRole } from '@prisma/client';

interface CreateActualData {
  activityId: string;
  entryDate: Date;
  amountUsd: number;
  category: string;
  description?: string;
}

interface UpdateActualData {
  entryDate?: Date;
  amountUsd?: number;
  category?: string;
  description?: string;
}

export class ActualService {
  async createActual(
    data: CreateActualData,
    createdById: string,
    createdByRole: UserRole,
    ipAddress?: string
  ) {
    // Verify activity exists
    const activity = await prisma.activity.findUnique({
      where: { id: data.activityId, deletedAt: null },
    });

    if (!activity) {
      throw new Error('Activity not found');
    }

    // Create actual
    const actual = await prisma.actual.create({
      data: {
        activityId: data.activityId,
        entryDate: data.entryDate,
        amountUsd: data.amountUsd,
        category: data.category,
        description: data.description,
        createdById,
        updatedById: createdById,
      },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        attachments: {
          where: { deletedAt: null },
          select: {
            id: true,
            fileName: true,
            originalFileName: true,
            fileSize: true,
            mimeType: true,
            virusScanStatus: true,
            uploadedAt: true,
          },
        },
      },
    });

    // Update activity's actualSpendUsdTotal
    await this.recomputeActivityActuals(data.activityId);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: createdById,
        actorRole: createdByRole,
        action: 'Create',
        objectType: 'Actual',
        objectId: actual.id,
        newValues: {
          activityId: data.activityId,
          amountUsd: data.amountUsd,
          category: data.category,
        },
        ipAddress,
      },
    });

    // Check variance and notify if exceeded
    await this.checkVarianceAlert(data.activityId);

    return actual;
  }

  async updateActual(
    actualId: string,
    data: UpdateActualData,
    updatedById: string,
    updatedByRole: UserRole,
    ipAddress?: string
  ) {
    // Get current actual
    const currentActual = await prisma.actual.findUnique({
      where: { id: actualId, deletedAt: null },
    });

    if (!currentActual) {
      throw new Error('Actual not found');
    }

    // Update actual
    const updated = await prisma.actual.update({
      where: { id: actualId },
      data: {
        ...data,
        updatedById,
      },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        attachments: {
          where: { deletedAt: null },
          select: {
            id: true,
            fileName: true,
            originalFileName: true,
            fileSize: true,
            mimeType: true,
            virusScanStatus: true,
            uploadedAt: true,
          },
        },
      },
    });

    // Recompute activity actuals
    await this.recomputeActivityActuals(currentActual.activityId);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: updatedById,
        actorRole: updatedByRole,
        action: 'Update',
        objectType: 'Actual',
        objectId: actualId,
        oldValues: {
          amountUsd: currentActual.amountUsd,
          category: currentActual.category,
        },
        newValues: {
          amountUsd: data.amountUsd,
          category: data.category,
        },
        ipAddress,
      },
    });

    // Check variance
    await this.checkVarianceAlert(currentActual.activityId);

    return updated;
  }

  async deleteActual(
    actualId: string,
    deletedById: string,
    deletedByRole: UserRole,
    ipAddress?: string
  ) {
    const actual = await prisma.actual.findUnique({
      where: { id: actualId, deletedAt: null },
    });

    if (!actual) {
      throw new Error('Actual not found');
    }

    // Soft delete
    await prisma.actual.update({
      where: { id: actualId },
      data: { deletedAt: new Date() },
    });

    // Recompute activity actuals
    await this.recomputeActivityActuals(actual.activityId);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: deletedById,
        actorRole: deletedByRole,
        action: 'Delete',
        objectType: 'Actual',
        objectId: actualId,
        ipAddress,
      },
    });

    return { success: true };
  }

  async getActualsByActivity(activityId: string) {
    return await prisma.actual.findMany({
      where: { activityId, deletedAt: null },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        attachments: {
          where: { deletedAt: null },
          select: {
            id: true,
            fileName: true,
            originalFileName: true,
            fileSize: true,
            mimeType: true,
            virusScanStatus: true,
            uploadedAt: true,
          },
        },
      },
      orderBy: { entryDate: 'desc' },
    });
  }

  private async recomputeActivityActuals(activityId: string) {
    const actuals = await prisma.actual.findMany({
      where: { activityId, deletedAt: null },
      select: { amountUsd: true },
    });

    const total = actuals.reduce((sum, a) => sum + a.amountUsd.toNumber(), 0);

    await prisma.activity.update({
      where: { id: activityId },
      data: { actualSpendUsdTotal: total },
    });
  }

  private async checkVarianceAlert(activityId: string) {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: {
        title: true,
        estimatedSpendUsdTotal: true,
        actualSpendUsdTotal: true,
      },
    });

    if (!activity) return;

    const estimated = activity.estimatedSpendUsdTotal?.toNumber() || 0;
    const actual = activity.actualSpendUsdTotal?.toNumber() || 0;

    if (actual > estimated) {
      const variance = ((actual - estimated) / estimated) * 100;

      // Notify Finance users
      const financeUsers = await prisma.user.findMany({
        where: { OR: [{ role: 'Finance' }, { role: 'Admin' }] },
        select: { id: true },
      });

      for (const user of financeUsers) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'VarianceAlert',
            title: 'Spend Exceeded Estimate',
            message: `${activity.title} has exceeded estimated spend by ${variance.toFixed(1)}%`,
            link: `/activities?activityId=${activityId}`,
            isRead: false,
            isEmailSent: false,
          },
        });
      }
    }
  }
}

export const actualService = new ActualService();
