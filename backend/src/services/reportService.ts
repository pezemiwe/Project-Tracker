import PDFDocument from "pdfkit";
import { prisma } from "../utils/prisma.js";

export class ReportService {
  /**
   * Generate Financial Summary Report
   */
  async generateFinancialReport(): Promise<Buffer> {
    const [activities, objectives] = await Promise.all([
      prisma.activity.findMany({
        where: { deletedAt: null },
        include: {
          investmentObjective: {
            select: { title: true },
          },
        },
        orderBy: { sn: "asc" },
      }),
      prisma.investmentObjective.findMany({
        where: { deletedAt: null },
        orderBy: { sn: "asc" },
      }),
    ]);

    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    // Header
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("Financial Summary Report", { align: "center" });
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(new Date().toLocaleDateString("en-GB"), { align: "center" });
    doc.moveDown(2);

    // Calculate totals
    const totalEstimated = activities.reduce(
      (sum, a) => sum + (a.estimatedSpendUsdTotal?.toNumber() || 0),
      0,
    );
    const totalActual = activities.reduce(
      (sum, a) => sum + (a.actualSpendUsdTotal?.toNumber() || 0),
      0,
    );
    const variance = totalActual - totalEstimated;
    const variancePercent =
      totalEstimated > 0 ? ((variance / totalEstimated) * 100).toFixed(1) : "0";

    // Executive Summary
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Executive Summary", { underline: true });
    doc.moveDown(0.5);

    const summaryData = [
      ["Total Estimated Budget:", `$${totalEstimated.toLocaleString("en-US")}`],
      ["Total Actual Spend:", `$${totalActual.toLocaleString("en-US")}`],
      [
        "Budget Variance:",
        `$${variance.toLocaleString("en-US")} (${variancePercent}%)`,
      ],
      ["Total Activities:", activities.length.toString()],
      ["Total Objectives:", objectives.length.toString()],
    ];

    doc.fontSize(11).font("Helvetica");
    summaryData.forEach(([label, value]) => {
      doc
        .text(`${label} `, { continued: true })
        .font("Helvetica-Bold")
        .text(value);
      doc.font("Helvetica");
    });

    doc.moveDown(2);

    // Breakdown by Objective
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Breakdown by Objective", { underline: true });
    doc.moveDown(1);

    for (const objective of objectives) {
      const objectiveActivities = activities.filter(
        (a) => a.investmentObjectiveId === objective.id,
      );

      const objEstimated = objectiveActivities.reduce(
        (sum, a) => sum + (a.estimatedSpendUsdTotal?.toNumber() || 0),
        0,
      );
      const objActual = objectiveActivities.reduce(
        (sum, a) => sum + (a.actualSpendUsdTotal?.toNumber() || 0),
        0,
      );

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(`${objective.sn}: ${objective.title}`);
      doc.fontSize(10).font("Helvetica");
      doc.text(`Activities: ${objectiveActivities.length}`);
      doc.text(`Estimated: $${objEstimated.toLocaleString("en-US")}`);
      doc.text(`Actual: $${objActual.toLocaleString("en-US")}`);
      doc.text(
        `Variance: $${(objActual - objEstimated).toLocaleString("en-US")}`,
      );
      doc.moveDown(1);
    }

    doc.addPage();

    // Activity Details Table
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Activity Details", { underline: true });
    doc.moveDown(1);

    // Table header
    const tableTop = doc.y;
    const colWidths = {
      sn: 40,
      title: 180,
      estimated: 80,
      actual: 80,
      variance: 80,
      status: 60,
    };

    doc.fontSize(9).font("Helvetica-Bold");
    let x = 50;
    doc.text("SN", x, tableTop, { width: colWidths.sn });
    x += colWidths.sn;
    doc.text("Activity", x, tableTop, { width: colWidths.title });
    x += colWidths.title;
    doc.text("Estimated", x, tableTop, { width: colWidths.estimated });
    x += colWidths.estimated;
    doc.text("Actual", x, tableTop, { width: colWidths.actual });
    x += colWidths.actual;
    doc.text("Variance", x, tableTop, { width: colWidths.variance });
    x += colWidths.variance;
    doc.text("Status", x, tableTop, { width: colWidths.status });

    doc
      .moveTo(50, doc.y + 2)
      .lineTo(550, doc.y + 2)
      .stroke();
    doc.moveDown(0.5);

    // Table rows
    doc.font("Helvetica").fontSize(8);
    for (const activity of activities) {
      const rowY = doc.y;
      const estimated = activity.estimatedSpendUsdTotal?.toNumber() || 0;
      const actual = activity.actualSpendUsdTotal?.toNumber() || 0;
      const actVariance = actual - estimated;

      // Check if we need a new page
      if (rowY > 700) {
        doc.addPage();
        doc.y = 50;
      }

      x = 50;
      doc.text(String(activity.sn), x, doc.y, {
        width: colWidths.sn,
        height: 20,
        ellipsis: true,
      });
      x += colWidths.sn;
      doc.text(activity.title, x, rowY, {
        width: colWidths.title,
        height: 20,
        ellipsis: true,
      });
      x += colWidths.title;
      doc.text(`$${estimated.toLocaleString("en-US")}`, x, rowY, {
        width: colWidths.estimated,
      });
      x += colWidths.estimated;
      doc.text(`$${actual.toLocaleString("en-US")}`, x, rowY, {
        width: colWidths.actual,
      });
      x += colWidths.actual;
      doc.text(`$${actVariance.toLocaleString("en-US")}`, x, rowY, {
        width: colWidths.variance,
      });
      x += colWidths.variance;
      doc.text(activity.status, x, rowY, { width: colWidths.status });

      doc.moveDown(0.8);
    }

    // Footer
    doc
      .fontSize(8)
      .font("Helvetica")
      .text("Generated by Donor Oversight System", 50, 750, {
        align: "center",
      });

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });
  }

  /**
   * Generate Audit Trail Report
   */
  async generateAuditReport(filters: {
    objectType?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Buffer> {
    const where: any = {};

    if (filters.objectType) where.objectType = filters.objectType;
    if (filters.action) where.action = filters.action;
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = new Date(filters.startDate);
      if (filters.endDate) where.timestamp.lte = new Date(filters.endDate);
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: { fullName: true },
        },
      },
      orderBy: { timestamp: "desc" },
      take: 1000, // Limit to prevent large PDFs
    });

    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    // Header
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("Audit Trail Report", { align: "center" });
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(new Date().toLocaleDateString("en-GB"), { align: "center" });
    doc.moveDown(2);

    // Filters Applied
    doc.fontSize(12).font("Helvetica-Bold").text("Filters Applied:");
    doc.fontSize(10).font("Helvetica");
    if (filters.objectType) doc.text(`Object Type: ${filters.objectType}`);
    if (filters.action) doc.text(`Action: ${filters.action}`);
    if (filters.startDate)
      doc.text(
        `Start Date: ${new Date(filters.startDate).toLocaleDateString("en-GB")}`,
      );
    if (filters.endDate)
      doc.text(
        `End Date: ${new Date(filters.endDate).toLocaleDateString("en-GB")}`,
      );
    if (
      !filters.objectType &&
      !filters.action &&
      !filters.startDate &&
      !filters.endDate
    ) {
      doc.text("No filters (showing all records, limited to 1000)");
    }
    doc.moveDown(1);

    doc.text(`Total Records: ${auditLogs.length}`);
    doc.moveDown(2);

    // Audit Log Entries
    doc.fontSize(14).font("Helvetica-Bold").text("Audit Log Entries");
    doc.moveDown(1);

    for (const log of auditLogs) {
      // Check if we need a new page
      if (doc.y > 680) {
        doc.addPage();
      }

      doc.fontSize(10).font("Helvetica-Bold");
      doc.text(
        `${new Date(log.timestamp).toLocaleString("en-GB")} - ${log.action}`,
        {
          continued: true,
        },
      );
      doc.font("Helvetica").text(` on ${log.objectType}`);

      doc.fontSize(9);
      doc.text(`Actor: ${log.actor?.fullName || "System"} (${log.actorRole})`);
      doc.text(`Object ID: ${log.objectId}`);

      if (log.comment) {
        doc.text(`Comment: ${log.comment}`);
      }

      if (log.ipAddress) {
        doc.text(`IP Address: ${log.ipAddress}`);
      }

      doc.moveDown(1);

      // Draw separator line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);
    }

    // Footer
    doc
      .fontSize(8)
      .font("Helvetica")
      .text("Generated by Donor Oversight System", 50, 750, {
        align: "center",
      });

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });
  }

  /**
   * Generate Activity Status Report
   */
  async generateActivityReport(): Promise<Buffer> {
    const objectives = await prisma.investmentObjective.findMany({
      where: { deletedAt: null },
      include: {
        activities: {
          where: { deletedAt: null },
          orderBy: { sn: "asc" },
        },
      },
      orderBy: { sn: "asc" },
    });

    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    // Header
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("Activity Status Report", { align: "center" });
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(new Date().toLocaleDateString("en-GB"), { align: "center" });
    doc.moveDown(2);

    // Summary
    const totalActivities = objectives.reduce(
      (sum, obj) => sum + obj.activities.length,
      0,
    );
    const statusCounts = objectives
      .flatMap((obj) => obj.activities)
      .reduce(
        (acc, activity) => {
          acc[activity.status] = (acc[activity.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    doc.fontSize(14).font("Helvetica-Bold").text("Summary");
    doc.moveDown(0.5);
    doc.fontSize(11).font("Helvetica");
    doc.text(`Total Activities: ${totalActivities}`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      doc.text(`${status}: ${count}`);
    });
    doc.moveDown(2);

    // Activities by Objective
    for (const objective of objectives) {
      if (doc.y > 600) {
        doc.addPage();
      }

      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text(`${objective.sn}: ${objective.title}`, { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(10).font("Helvetica");
      doc.moveDown(1);

      if (objective.activities.length === 0) {
        doc.fontSize(9).font("Helvetica-Oblique").text("No activities");
        doc.moveDown(2);
        continue;
      }

      // Activities table
      for (const activity of objective.activities) {
        if (doc.y > 700) {
          doc.addPage();
        }

        doc.fontSize(11).font("Helvetica-Bold").text(String(activity.sn), {
          continued: true,
        });
        doc.font("Helvetica").text(` - ${activity.title}`);

        doc.fontSize(9);
        doc.text(`Status: ${activity.status}`);
        doc.text(`Lead: ${activity.lead || "N/A"}`);

        if (activity.startDate && activity.endDate) {
          doc.text(
            `Period: ${new Date(activity.startDate).toLocaleDateString("en-GB")} - ${new Date(activity.endDate).toLocaleDateString("en-GB")}`,
          );
        }

        const estimated = activity.estimatedSpendUsdTotal?.toNumber() || 0;
        const actual = activity.actualSpendUsdTotal?.toNumber() || 0;
        doc.text(
          `Budget: $${estimated.toLocaleString("en-US")} (Actual: $${actual.toLocaleString("en-US")})`,
        );

        doc.moveDown(0.8);
      }

      doc.moveDown(1);
    }

    // Footer
    doc
      .fontSize(8)
      .font("Helvetica")
      .text("Generated by Donor Oversight System", 50, 750, {
        align: "center",
      });

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });
  }
}

export const reportService = new ReportService();
