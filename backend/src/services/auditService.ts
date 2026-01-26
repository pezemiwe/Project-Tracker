import { prisma } from "../utils/prisma.js";

interface AuditLogFilters {
  objectType?: string;
  objectId?: string;
  actorId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
}

export class AuditService {
  async getAuditLogs(
    filters: AuditLogFilters,
    page: number = 1,
    limit: number = 50
  ) {
    const where = this.buildWhereClause(filters);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: { fullName: true, email: true },
          },
        },
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getValueHistory(objectType: string, objectId: string, field: string) {
    const logs = await prisma.auditLog.findMany({
      where: {
        objectType,
        objectId,
        OR: [
          { previousValues: { path: [field], not: null } },
          { newValues: { path: [field], not: null } },
        ],
      },
      include: {
        actor: {
          select: { fullName: true },
        },
      },
      orderBy: { timestamp: "desc" },
    });

    return logs.map((log) => ({
      timestamp: log.timestamp,
      actor: log.actor?.fullName || "System",
      actorRole: log.actorRole,
      previousValue: (log.previousValues as any)?.[field],
      newValue: (log.newValues as any)?.[field],
      comment: log.comment,
      action: log.action,
    }));
  }

  async exportAuditLogs(filters: AuditLogFilters): Promise<string> {
    const where = this.buildWhereClause(filters);

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: { fullName: true, email: true },
        },
      },
      orderBy: { timestamp: "desc" },
    });

    const headers = [
      "Timestamp",
      "Actor",
      "Role",
      "Action",
      "Object Type",
      "Object ID",
      "Previous Values",
      "New Values",
      "Comment",
      "IP Address",
    ];

    const rows = logs.map((log) => [
      log.timestamp.toISOString(),
      log.actor?.fullName || "System",
      log.actorRole || "",
      log.action,
      log.objectType,
      log.objectId,
      JSON.stringify(log.previousValues || {}),
      JSON.stringify(log.newValues || {}),
      log.comment || "",
      log.ipAddress || "",
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
  }

  private buildWhereClause(filters: AuditLogFilters) {
    const where: any = {};

    if (filters.objectType) where.objectType = filters.objectType;
    if (filters.objectId) where.objectId = filters.objectId;
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.action) where.action = filters.action;

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    return where;
  }

  async getActivityFeed(limit: number = 20) {
    const logs = await prisma.auditLog.findMany({
      include: {
        actor: {
          select: { fullName: true },
        },
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return logs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      actorName: log.actor?.fullName || "System",
      action: log.action,
      objectType: log.objectType,
      objectId: log.objectId,
      description: this.formatFeedDescription(log),
    }));
  }

  private formatFeedDescription(log: any) {
    const actor = log.actor?.fullName || "System";
    const objectType = log.objectType;
    const action = log.action;
    const title = (log.newValues as any)?.title || (log.previousValues as any)?.title || "";
    const nameStr = title ? ` "${title}"` : "";

    switch (action) {
      case "Create":
        return `${actor} created ${objectType}${nameStr}`;
      case "Update":
        return `${actor} updated ${objectType}${nameStr}`;
      case "Delete":
        return `${actor} deleted ${objectType}${nameStr}`;
      case "Approve":
        return `${actor} approved ${objectType}${nameStr}`;
      case "Reject":
        return `${actor} rejected ${objectType}${nameStr}`;
      default:
        return `${actor} performed ${action} on ${objectType}${nameStr}`;
    }
  }
}

export const auditService = new AuditService();
