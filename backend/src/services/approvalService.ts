import { ApprovalState, ApprovalTargetType, UserRole } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { emailService } from "./emailService.js";

interface CreateApprovalData {
  targetType: ApprovalTargetType;
  targetId: string;
  oldValue?: number;
  newValue?: number;
  comment?: string;
}

interface ApprovalAction {
  comment?: string;
}

interface RejectApprovalData {
  reason: string;
}

interface StateTransition {
  state: ApprovalState;
  actorId: string;
  timestamp: Date;
  comment?: string;
}

export class ApprovalService {
  /**
   * Fetch threshold settings from database
   */
  private async getThresholdSettings(): Promise<{
    usd: number;
    percent: number;
  }> {
    const [usdSetting, percentSetting] = await Promise.all([
      prisma.systemSetting.findUnique({
        where: { key: "approvalThresholdUsd" },
      }),
      prisma.systemSetting.findUnique({
        where: { key: "approvalThresholdPercent" },
      }),
    ]);

    return {
      usd: usdSetting?.value ? Number(usdSetting.value) : 5000,
      percent: percentSetting?.value ? Number(percentSetting.value) : 10,
    };
  }

  /**
   * Check if change is below threshold
   */
  private async checkThreshold(
    oldValue: number,
    newValue: number,
  ): Promise<boolean> {
    const changeAmount = Math.abs(newValue - oldValue);
    const changePercent = oldValue > 0 ? (changeAmount / oldValue) * 100 : 100;

    const threshold = await this.getThresholdSettings();

    return changeAmount < threshold.usd && changePercent < threshold.percent;
  }

  /**
   * Check if user has multiple roles (Finance + Committee)
   */
  private async checkMultiRole(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Admin has all permissions
    return user?.role === "Admin";
  }

  /**
   * Submit approval for review
   */
  async submitApproval(
    data: CreateApprovalData,
    submittedById: string,
    submittedByRole: UserRole,
    ipAddress?: string,
  ) {
    // Get target activity for context
    const activity = await prisma.activity.findUnique({
      where: { id: data.targetId },
      select: {
        title: true,
        estimatedSpendUsdTotal: true,
        investmentObjectiveId: true,
      },
    });

    if (!activity) {
      throw new Error("Target activity not found");
    }

    // Determine initial state based on threshold
    let initialState: ApprovalState = "Submitted";
    const belowThreshold =
      data.oldValue !== undefined && data.newValue !== undefined
        ? await this.checkThreshold(data.oldValue, data.newValue)
        : false;

    if (belowThreshold) {
      initialState = "FinanceApproved";
    }

    // Create approval with old/new values stored in history for audit trail
    const approval = await prisma.approval.create({
      data: {
        targetType: data.targetType,
        targetId: data.targetId,
        currentState: initialState,
        submittedById,
        submittedAt: new Date(),
        history: [
          {
            state: "Submitted",
            actorId: submittedById,
            timestamp: new Date().toISOString(),
            comment: data.comment,
            oldValue: data.oldValue,
            newValue: data.newValue,
          },
          ...(belowThreshold
            ? [
                {
                  state: "FinanceApproved",
                  actorId: "system",
                  timestamp: new Date().toISOString(),
                  comment: "Auto-approved (below threshold)",
                },
              ]
            : []),
        ],
      },
      include: {
        submittedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: submittedById,
        actorRole: submittedByRole,
        action: "Create",
        objectType: "Approval",
        objectId: approval.id,
        newValues: {
          targetType: data.targetType,
          targetId: data.targetId,
          currentState: initialState,
          belowThreshold,
        },
        ipAddress,
      },
    });

    // Create notifications for Finance users (if not auto-approved)
    if (!belowThreshold) {
      await this.notifyFinanceUsers(approval.id, activity.title, submittedById);
    } else {
      // Notify Committee users for auto-approved items
      await this.notifyCommitteeUsers(
        approval.id,
        activity.title,
        submittedById,
      );
    }

    return approval;
  }

  /**
   * Finance approves approval
   */
  async financeApprove(
    approvalId: string,
    approvedById: string,
    approvedByRole: UserRole,
    data: ApprovalAction,
    ipAddress?: string,
  ) {
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        submittedBy: { select: { fullName: true } },
      },
    });

    if (!approval) {
      throw new Error("Approval not found");
    }

    if (approval.currentState !== "Submitted") {
      throw new Error(`Cannot approve from state ${approval.currentState}`);
    }

    // Check if user has multi-role permissions
    const hasMultiRole = await this.checkMultiRole(approvedById);
    const nextState: ApprovalState = hasMultiRole
      ? "CommitteeApproved"
      : "FinanceApproved";

    // Build history entry
    const historyEntry: StateTransition = {
      state: "FinanceApproved",
      actorId: approvedById,
      timestamp: new Date(),
      comment: data.comment,
    };

    const history = Array.isArray(approval.history) ? approval.history : [];
    const newHistory = [...history, historyEntry];

    // Add auto-advance entry if multi-role
    if (hasMultiRole) {
      newHistory.push({
        state: "CommitteeApproved",
        actorId: approvedById,
        timestamp: new Date(),
        comment: "Auto-approved (multi-role user)",
      });
    }

    // Update approval
    const updated = await prisma.approval.update({
      where: { id: approvalId },
      data: {
        currentState: nextState,
        financeApprovedById: approvedById,
        financeApprovedAt: new Date(),
        financeComment: data.comment,
        committeeApprovedById: hasMultiRole ? approvedById : undefined,
        committeeApprovedAt: hasMultiRole ? new Date() : undefined,
        history: newHistory as any,
      },
      include: {
        submittedBy: { select: { id: true, fullName: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: approvedById,
        actorRole: approvedByRole,
        action: "Update",
        objectType: "Approval",
        objectId: approvalId,
        previousValues: { currentState: approval.currentState },
        newValues: { currentState: nextState, financeComment: data.comment },
        ipAddress,
      },
    });

    // Apply changes if final approval
    if (nextState === "CommitteeApproved") {
      await this.applyApprovedChanges(updated);
      // Notify submitter of final approval
      if (updated.submittedById) {
        await this.notifyUser(
          updated.submittedById,
          "ApprovalDecision",
          "Approval Completed",
          `Your estimate change has been fully approved`,
          `/approvals/${updated.id}`,
        );
      }

      // Send approval email
      try {
        if (updated.submittedById) {
          const submitter = await prisma.user.findUnique({
            where: { id: updated.submittedById },
            select: { email: true },
          });

          const activity = await prisma.activity.findUnique({
            where: { id: updated.targetId },
            select: {
              title: true,
              sn: true,
              estimatedSpendUsdTotal: true,
            },
          });

          if (submitter?.email && activity) {
            await emailService.sendApprovalApproved(
              {
                activityTitle: activity.title,
                activitySn: String(activity.sn),
                actorName: "Finance Team",
                estimatedSpend: `$${activity.estimatedSpendUsdTotal?.toNumber() || 0}`,
                approvalUrl: `${process.env.FRONTEND_URL}/approvals/${updated.id}`,
              },
              [submitter.email],
            );
          }
        }
      } catch (error) {
        console.error("Failed to send approval email:", error);
      }
    } else {
      // Notify Committee users
      const activity = await prisma.activity.findUnique({
        where: { id: updated.targetId },
        select: { title: true },
      });
      await this.notifyCommitteeUsers(
        approvalId,
        activity?.title || "Activity",
        approvedById,
      );
    }

    return updated;
  }

  /**
   * Committee approves approval
   */
  async committeeApprove(
    approvalId: string,
    approvedById: string,
    approvedByRole: UserRole,
    data: ApprovalAction,
    ipAddress?: string,
  ) {
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        submittedBy: { select: { id: true, fullName: true } },
      },
    });

    if (!approval) {
      throw new Error("Approval not found");
    }

    if (approval.currentState !== "FinanceApproved") {
      throw new Error(`Cannot approve from state ${approval.currentState}`);
    }

    // Build history entry
    const historyEntry: StateTransition = {
      state: "CommitteeApproved",
      actorId: approvedById,
      timestamp: new Date(),
      comment: data.comment,
    };

    const history = Array.isArray(approval.history) ? approval.history : [];
    const newHistory = [...history, historyEntry];

    // Update approval
    const updated = await prisma.approval.update({
      where: { id: approvalId },
      data: {
        currentState: "CommitteeApproved",
        committeeApprovedById: approvedById,
        committeeApprovedAt: new Date(),
        committeeComment: data.comment,
        history: newHistory as any,
      },
      include: {
        submittedBy: { select: { id: true, fullName: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: approvedById,
        actorRole: approvedByRole,
        action: "Update",
        objectType: "Approval",
        objectId: approvalId,
        previousValues: { currentState: approval.currentState },
        newValues: {
          currentState: "CommitteeApproved",
          committeeComment: data.comment,
        },
        ipAddress,
      },
    });

    // Apply approved changes
    await this.applyApprovedChanges(updated);

    // Notify submitter
    if (updated.submittedById) {
      await this.notifyUser(
        updated.submittedById,
        "ApprovalDecision",
        "Approval Completed",
        `Your estimate change has been fully approved`,
        `/approvals/${updated.id}`,
      );
    }

    // Send approval email
    try {
      if (updated.submittedById) {
        const submitter = await prisma.user.findUnique({
          where: { id: updated.submittedById },
          select: { email: true },
        });

        const activity = await prisma.activity.findUnique({
          where: { id: updated.targetId },
          select: {
            title: true,
            sn: true,
            estimatedSpendUsdTotal: true,
          },
        });

        if (submitter?.email && activity) {
          await emailService.sendApprovalApproved(
            {
              activityTitle: activity.title,
              activitySn: String(activity.sn),
              actorName: "Committee",
              estimatedSpend: `$${activity.estimatedSpendUsdTotal?.toNumber() || 0}`,
              approvalUrl: `${process.env.FRONTEND_URL}/approvals/${updated.id}`,
            },
            [submitter.email],
          );
        }
      }
    } catch (error) {
      console.error("Failed to send approval email:", error);
    }

    return updated;
  }

  /**
   * Reject approval
   */
  async rejectApproval(
    approvalId: string,
    rejectedById: string,
    rejectedByRole: UserRole,
    data: RejectApprovalData,
    ipAddress?: string,
  ) {
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        submittedBy: { select: { id: true, fullName: true } },
      },
    });

    if (!approval) {
      throw new Error("Approval not found");
    }

    if (!["Submitted", "FinanceApproved"].includes(approval.currentState)) {
      throw new Error(`Cannot reject from state ${approval.currentState}`);
    }

    // Build history entry
    const historyEntry: StateTransition = {
      state: "Rejected",
      actorId: rejectedById,
      timestamp: new Date(),
      comment: data.reason,
    };

    const history = Array.isArray(approval.history) ? approval.history : [];
    const newHistory = [...history, historyEntry];

    // Update approval
    const updated = await prisma.approval.update({
      where: { id: approvalId },
      data: {
        currentState: "Rejected",
        rejectedById,
        rejectedAt: new Date(),
        rejectionReason: data.reason,
        history: newHistory as any,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: rejectedById,
        actorRole: rejectedByRole,
        action: "Update",
        objectType: "Approval",
        objectId: approvalId,
        previousValues: { currentState: approval.currentState },
        newValues: { currentState: "Rejected", rejectionReason: data.reason },
        ipAddress,
      },
    });

    // Revert the changes since approval was rejected
    await this.revertRejectedChanges({ ...updated, history: newHistory });

    // Notify submitter of rejection
    if (updated.submittedById) {
      await this.notifyUser(
        updated.submittedById,
        "ApprovalDecision",
        "Approval Rejected",
        `Your estimate change was rejected: ${data.reason}`,
        `/approvals/${updated.id}`,
      );
    }

    // Send rejection email
    try {
      if (updated.submittedById) {
        const submitter = await prisma.user.findUnique({
          where: { id: updated.submittedById },
          select: { email: true },
        });

        const activity = await prisma.activity.findUnique({
          where: { id: updated.targetId },
          select: {
            title: true,
            sn: true,
            estimatedSpendUsdTotal: true,
          },
        });

        if (submitter?.email && activity) {
          await emailService.sendApprovalRejected(
            {
              activityTitle: activity.title,
              activitySn: String(activity.sn),
              actorName: "Approver",
              estimatedSpend: `$${activity.estimatedSpendUsdTotal?.toNumber() || 0}`,
              reason: data.reason,
              approvalUrl: `${process.env.FRONTEND_URL}/approvals/${updated.id}`,
            },
            [submitter.email],
          );
        }
      }
    } catch (error) {
      console.error("Failed to send rejection email:", error);
    }

    return updated;
  }

  /**
   * Get approval by ID
   */
  async getApprovalById(approvalId: string) {
    return await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        submittedBy: { select: { id: true, fullName: true, email: true } },
        financeApprovedBy: {
          select: { id: true, fullName: true, email: true },
        },
        committeeApprovedBy: {
          select: { id: true, fullName: true, email: true },
        },
        rejectedBy: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  /**
   * Get approvals with filters
   */
  async getApprovals(filters?: {
    state?: ApprovalState;
    targetType?: ApprovalTargetType;
    targetId?: string;
    submittedById?: string;
  }) {
    return await prisma.approval.findMany({
      where: {
        currentState: filters?.state,
        targetType: filters?.targetType,
        targetId: filters?.targetId,
        submittedById: filters?.submittedById,
      },
      include: {
        submittedBy: { select: { id: true, fullName: true, email: true } },
        financeApprovedBy: {
          select: { id: true, fullName: true, email: true },
        },
        committeeApprovedBy: {
          select: { id: true, fullName: true, email: true },
        },
        rejectedBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get approvals pending action from user
   */
  async getPendingApprovals(_userId: string, userRole: UserRole) {
    const conditions: any[] = [];

    // Finance role sees Submitted approvals
    if (userRole === "Finance" || userRole === "Admin") {
      conditions.push({ currentState: "Submitted" });
    }

    // Committee role sees FinanceApproved approvals
    if (userRole === "CommitteeMember" || userRole === "Admin") {
      conditions.push({ currentState: "FinanceApproved" });
    }

    if (conditions.length === 0) {
      return [];
    }

    return await prisma.approval.findMany({
      where: {
        OR: conditions,
      },
      include: {
        submittedBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Apply approved changes to target object
   * Note: In current design, changes are applied immediately on save.
   * This method confirms the change and logs the approval.
   */
  private async applyApprovedChanges(approval: any) {
    if (approval.targetType === "EstimateChange") {
      // Get the change values from history
      const history = Array.isArray(approval.history) ? approval.history : [];
      const submitEntry = history.find((h: any) => h.state === "Submitted");

      if (submitEntry?.newValue !== undefined) {
        // Log that the change has been approved
        console.log(
          `Approval ${approval.id}: Estimate change for activity ${approval.targetId} ` +
            `from ${submitEntry.oldValue} to ${submitEntry.newValue} has been approved`,
        );
      }
    }
  }

  /**
   * Revert changes when approval is rejected
   */
  private async revertRejectedChanges(approval: any) {
    if (approval.targetType === "EstimateChange") {
      // Get the original value from history
      const history = Array.isArray(approval.history) ? approval.history : [];
      const submitEntry = history.find((h: any) => h.state === "Submitted");

      if (submitEntry?.oldValue !== undefined) {
        // Revert the activity to the original estimate
        await prisma.activity.update({
          where: { id: approval.targetId },
          data: {
            estimatedSpendUsdTotal: submitEntry.oldValue,
          },
        });

        console.log(
          `Approval ${approval.id}: Reverted activity ${approval.targetId} ` +
            `estimate from ${submitEntry.newValue} back to ${submitEntry.oldValue}`,
        );
      }
    }
  }

  /**
   * Notify Finance users of new submission
   */
  private async notifyFinanceUsers(
    approvalId: string,
    activityTitle: string,
    submitterId: string,
  ) {
    const financeUsers = await prisma.user.findMany({
      where: {
        OR: [{ role: "Finance" }, { role: "Admin" }],
        id: { not: submitterId }, // Don't notify submitter
      },
      select: { id: true, email: true },
    });

    const submitter = await prisma.user.findUnique({
      where: { id: submitterId },
      select: { fullName: true },
    });

    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        submittedBy: { select: { fullName: true } },
      },
    });

    const activity = await prisma.activity.findUnique({
      where: { id: approval?.targetId },
      select: {
        sn: true,
        estimatedSpendUsdTotal: true,
      },
    });

    // Send in-app notifications
    for (const user of financeUsers) {
      await this.notifyUser(
        user.id,
        "ApprovalSubmitted",
        "New Approval Request",
        `${submitter?.fullName || "User"} submitted estimate change for ${activityTitle}`,
        `/approvals/${approvalId}`,
      );
    }

    // Send email notifications
    try {
      const emailAddresses = financeUsers.map((u) => u.email).filter((e) => e);
      if (emailAddresses.length > 0) {
        await emailService.sendApprovalSubmitted(
          {
            activityTitle,
            activitySn: String(activity?.sn || ""),
            actorName: submitter?.fullName || "User",
            estimatedSpend: `$${activity?.estimatedSpendUsdTotal?.toNumber() || 0}`,
            approvalUrl: `${process.env.FRONTEND_URL}/approvals/${approvalId}`,
          },
          emailAddresses,
        );
      }
    } catch (error) {
      console.error("Failed to send email notification:", error);
    }
  }

  /**
   * Notify Committee users of Finance approval
   */
  private async notifyCommitteeUsers(
    approvalId: string,
    activityTitle: string,
    excludeUserId?: string,
  ) {
    const committeeUsers = await prisma.user.findMany({
      where: {
        OR: [{ role: "CommitteeMember" }, { role: "Admin" }],
        id: excludeUserId ? { not: excludeUserId } : undefined,
      },
      select: { id: true, email: true },
    });

    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        submittedBy: { select: { fullName: true } },
      },
    });

    const activity = await prisma.activity.findUnique({
      where: { id: approval?.targetId },
      select: {
        sn: true,
        estimatedSpendUsdTotal: true,
      },
    });

    // Send in-app notifications
    for (const user of committeeUsers) {
      await this.notifyUser(
        user.id,
        "ApprovalSubmitted",
        "Approval Awaiting Committee Review",
        `Estimate change for ${activityTitle} requires committee approval`,
        `/approvals/${approvalId}`,
      );
    }

    // Send email notifications
    try {
      const emailAddresses = committeeUsers
        .map((u) => u.email)
        .filter((e) => e);
      if (emailAddresses.length > 0) {
        await emailService.sendApprovalFinanceApproved(
          {
            activityTitle,
            activitySn: String(activity?.sn || ""),
            actorName: "Finance Team",
            estimatedSpend: `$${activity?.estimatedSpendUsdTotal?.toNumber() || 0}`,
            approvalUrl: `${process.env.FRONTEND_URL}/approvals/${approvalId}`,
          },
          emailAddresses,
        );
      }
    } catch (error) {
      console.error("Failed to send email notification:", error);
    }
  }

  /**
   * Create notification for single user
   */
  private async notifyUser(
    userId: string,
    type: string,
    title: string,
    message: string,
    link?: string,
  ) {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
        isRead: false,
        isEmailSent: false,
      },
    });
  }
}

export const approvalService = new ApprovalService();
