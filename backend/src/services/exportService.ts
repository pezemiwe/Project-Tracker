import XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { prisma } from '../utils/prisma.js';

export class ExportService {
  /**
   * Export activities to Excel
   */
  async exportActivities(filters?: {
    objectiveId?: string;
    status?: string;
    lead?: string;
    startYear?: number;
    endYear?: number;
  }): Promise<Buffer> {
    const where: any = { deletedAt: null };

    if (filters?.objectiveId) {
      where.investmentObjectiveId = filters.objectiveId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.lead) {
      where.lead = { contains: filters.lead, mode: 'insensitive' };
    }
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
      include: {
        investmentObjective: {
          select: { sn: true, title: true, states: true, regions: true },
        },
        createdBy: {
          select: { fullName: true },
        },
      },
      orderBy: { sn: 'asc' },
    });

    const rows = activities.map((activity) => {
      const baseRow: any = {
        'Activity ID': `ACT-${String(activity.sn).padStart(4, '0')}`,
        'Objective ID': `OBJ-${String(activity.investmentObjective.sn).padStart(4, '0')}`,
        'Objective Title': activity.investmentObjective.title,
        'States': activity.investmentObjective.states.join(', '),
        'Regions': activity.investmentObjective.regions.join(', '),
        'Title': activity.title,
        'Description': activity.descriptionAndObjective || '',
        'Start Date': activity.startDate?.toISOString().split('T')[0] || '',
        'End Date': activity.endDate?.toISOString().split('T')[0] || '',
        'Status': activity.status,
        'Progress %': activity.progressPercent,
        'Lead': activity.lead || '',
        'Estimated Spend (USD)': activity.estimatedSpendUsdTotal?.toNumber() || 0,
        'Actual Spend (USD)': (activity as any).actualSpendUsdTotal?.toNumber() || 0,
        'Risk Rating': activity.riskRating || '',
        'Priority': activity.priority || '',
        'Created By': activity.createdBy?.fullName || '',
        'Created At': activity.createdAt.toISOString().split('T')[0],
      };

      // Add annual estimates
      const annualEstimates = activity.annualEstimates as Record<string, number>;
      for (let year = 2020; year <= 2040; year++) {
        baseRow[`Estimate ${year}`] = annualEstimates?.[year] || 0;
      }

      return baseRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Set column widths
    const colWidths = Object.keys(rows[0] || {}).map(() => ({ wch: 15 }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Activities');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  /**
   * Export actuals to Excel
   */
  async exportActuals(activityId?: string): Promise<Buffer> {
    const where: any = { deletedAt: null };
    if (activityId) {
      where.activityId = activityId;
    }

    const actuals = await prisma.actual.findMany({
      where,
      include: {
        activity: {
          select: {
            sn: true,
            title: true,
            investmentObjective: {
              select: { sn: true, title: true },
            },
          },
        },
        createdBy: {
          select: { fullName: true },
        },
        attachments: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
      orderBy: { entryDate: 'desc' },
    });

    const rows = actuals.map((actual) => ({
      'Objective ID': `OBJ-${String(actual.activity.investmentObjective.sn).padStart(4, '0')}`,
      'Objective Title': actual.activity.investmentObjective.title,
      'Activity ID': `ACT-${String(actual.activity.sn).padStart(4, '0')}`,
      'Activity Title': actual.activity.title,
      'Entry Date': actual.entryDate.toISOString().split('T')[0],
      'Amount (USD)': actual.amountUsd.toNumber(),
      'Category': actual.category,
      'Description': actual.description || '',
      'Attachments': actual.attachments.length,
      'Recorded By': actual.createdBy.fullName,
      'Recorded At': actual.createdAt.toISOString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Actuals');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  /**
   * Generate financial summary report
   */
  async generateFinancialReport(): Promise<Buffer> {
    const objectives = await prisma.investmentObjective.findMany({
      where: { deletedAt: null },
      include: {
        activities: {
          where: { deletedAt: null },
          select: {
            sn: true,
            title: true,
            status: true,
            estimatedSpendUsdTotal: true,
            actualSpendUsdTotal: true,
            annualEstimates: true,
          },
        },
      },
      orderBy: { sn: 'asc' },
    });

    const rows = objectives.flatMap((objective) => {
      const totalEstimated = objective.activities.reduce(
        (sum, a) => sum + (a.estimatedSpendUsdTotal?.toNumber() || 0),
        0
      );
      const totalActual = objective.activities.reduce(
        (sum, a) => sum + ((a as any).actualSpendUsdTotal?.toNumber() || 0),
        0
      );
      const variance = totalActual - totalEstimated;
      const variancePercent = totalEstimated > 0 ? (variance / totalEstimated) * 100 : 0;

      return [
        // Objective summary row
        {
          'Level': 'Objective',
          'ID': `OBJ-${String(objective.sn).padStart(4, '0')}`,
          'Title': objective.title,
          'Regions': objective.regions.join(', '),
          'Status': objective.status,
          'Estimated Spend (USD)': totalEstimated,
          'Actual Spend (USD)': totalActual,
          'Variance (USD)': variance,
          'Variance (%)': variancePercent.toFixed(2),
        },
        // Activity detail rows
        ...objective.activities.map((activity) => {
          const actEstimated = activity.estimatedSpendUsdTotal?.toNumber() || 0;
          const actActual = (activity as any).actualSpendUsdTotal?.toNumber() || 0;
          const actVariance = actActual - actEstimated;
          const actVariancePercent = actEstimated > 0 ? (actVariance / actEstimated) * 100 : 0;

          return {
            'Level': 'Activity',
            'ID': `ACT-${String(activity.sn).padStart(4, '0')}`,
            'Title': `  → ${activity.title}`,
            'Region': '',
            'Status': activity.status,
            'Estimated Spend (USD)': actEstimated,
            'Actual Spend (USD)': actActual,
            'Variance (USD)': actVariance,
            'Variance (%)': actVariancePercent.toFixed(2),
          };
        }),
      ];
    });

    const worksheet = XLSX.utils.json_to_sheet(rows.flat());

    // Add summary at top
    const summaryData = [
      {
        'Report': 'Financial Summary Report',
        'Generated': new Date().toISOString().split('T')[0],
      },
      {},
    ];

    XLSX.utils.sheet_add_json(worksheet, summaryData, { origin: 'A1', skipHeader: true });
    XLSX.utils.sheet_add_json(worksheet, rows.flat(), { origin: 'A4' });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial Summary');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  /**
   * Generate a PDF report of objectives and activities
   */
  async generatePDFReport(objectiveId?: string): Promise<Buffer> {
    const where: any = { deletedAt: null };
    if (objectiveId) {
      where.id = objectiveId;
    }

    const objectives = await prisma.investmentObjective.findMany({
      where,
      include: {
        activities: {
          where: { deletedAt: null },
          orderBy: { sn: 'asc' },
        },
      },
      orderBy: { sn: 'asc' },
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Report Title
      doc.fillColor('#1a365d').fontSize(24).text('Investment Portfolio Report', { align: 'center' });
      doc.fillColor('#4a5568').fontSize(10).text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Summary Stats
      const totalEstimated = objectives.reduce((sum, obj) => 
        sum + obj.activities.reduce((s, a) => s + (a.estimatedSpendUsdTotal?.toNumber() || 0), 0), 0
      );
      const totalActivities = objectives.reduce((sum, obj) => sum + obj.activities.length, 0);

      doc.rect(50, doc.y, 500, 60).fill('#f7fafc');
      doc.fillColor('#2d3748').fontSize(12).text('Portfolio Summary', 65, doc.y - 50);
      doc.fontSize(10).text(`Total Objectives: ${objectives.length}`, 65, doc.y + 5);
      doc.text(`Total Activities: ${totalActivities}`, 200, doc.y - 12);
      doc.text(`Total Estimated Spend: $${totalEstimated.toLocaleString()}`, 350, doc.y - 12);
      doc.moveDown(4);

      for (const objective of objectives) {
        // Page break if near bottom
        if (doc.y > 650) doc.addPage();

        // Objective Heading
        doc.fillColor('#1e40af').fontSize(16).text(`OBJ-${String(objective.sn).padStart(4, '0')}: ${objective.title}`);
        doc.fillColor('#64748b').fontSize(9).text(`Status: ${objective.status} | Regions: ${objective.regions.join(', ') || 'N/A'} | Range: ${objective.overallStartYear}-${objective.overallEndYear}`);
        doc.moveDown(0.5);
        
        if (objective.shortDescription) {
          doc.fillColor('#334155').fontSize(10).text(objective.shortDescription, { align: 'justify' });
        }
        doc.moveDown(1);

        // Activities Table
        if (objective.activities.length > 0) {
          doc.fillColor('#000').fontSize(10).font('Helvetica-Bold');
          const tableTop = doc.y;
          doc.text('ID', 55, tableTop);
          doc.text('Activity Title', 110, tableTop);
          doc.text('Status', 350, tableTop);
          doc.text('Estimated (USD)', 450, tableTop, { align: 'right' });
          
          doc.moveDown(0.2);
          doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#cbd5e1').stroke();
          doc.moveDown(0.5);
          doc.font('Helvetica');

          for (const activity of objective.activities) {
            if (doc.y > 750) {
              doc.addPage();
              // Repeat header on new page
              doc.fillColor('#000').fontSize(10).font('Helvetica-Bold');
              doc.text('ID', 55, doc.y);
              doc.text('Activity Title', 110, doc.y - 12);
              doc.text('Status', 350, doc.y - 12);
              doc.text('Estimated (USD)', 450, doc.y - 12, { align: 'right' });
              doc.moveDown(0.5);
              doc.font('Helvetica');
            }

            const rowY = doc.y;
            doc.fillColor('#475569').fontSize(9);
            doc.text(`ACT-${String(activity.sn).padStart(4, '0')}`, 55, rowY);
            doc.text(activity.title, 110, rowY, { width: 230 });
            doc.text(activity.status, 350, rowY);
            doc.text(`$${activity.estimatedSpendUsdTotal?.toNumber().toLocaleString() || '0'}`, 450, rowY, { align: 'right' });
            
            doc.moveDown(0.8);
            // Add a very faint line between rows
            doc.moveTo(55, doc.y).lineTo(545, doc.y).strokeColor('#f1f5f9').stroke();
            doc.moveDown(0.4);
          }
        } else {
          doc.font('Helvetica-Oblique').fontSize(9).fillColor('#94a3b8').text('No activities recorded for this objective.');
        }

        doc.moveDown(2);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
        doc.moveDown(2);
      }

      // Footer (Page Numbers)
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fillColor('#94a3b8').fontSize(8).text(
          `Page ${i + 1} of ${range.count}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );
      }

      doc.end();
    });
  }
}

export const exportService = new ExportService();
