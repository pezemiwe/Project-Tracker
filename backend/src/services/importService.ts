import XLSX from 'xlsx';
import { prisma } from '../utils/prisma.js';
import { UserRole, ActivityStatus } from '@prisma/client';
import { ACTIVITY_STATUSES, RISK_RATINGS, PRIORITY_LEVELS } from '../utils/constants.js';

interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  success: boolean;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
  preview?: any[];
}

interface ActivityImportRow {
  objectiveId?: string;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  progressPercent?: number;
  lead?: string;
  estimatedSpendUsd?: number;
  riskRating?: string;
  priority?: string;
  [key: string]: any; // For dynamic year columns
}

export class ImportService {
  /**
   * Parse Excel file and validate activity data
   */
  async parseActivityExcel(filePath: string): Promise<ImportResult> {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet) as ActivityImportRow[];

      const errors: ImportError[] = [];
      const validRows: any[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // Excel row (header is row 1)
        const rowErrors: ImportError[] = [];

        // Validate required fields
        if (!row.objectiveId) {
          rowErrors.push({ row: rowNum, field: 'objectiveId', message: 'Required field' });
        }
        if (!row.title || !row.title.trim()) {
          rowErrors.push({ row: rowNum, field: 'title', message: 'Required field' });
        }

        // Validate objective exists
        if (row.objectiveId) {
          const objectiveSn = parseInt(row.objectiveId.replace(/OBJ-/i, ''));
          if (isNaN(objectiveSn)) {
            rowErrors.push({ row: rowNum, field: 'objectiveId', message: 'Invalid format (use OBJ-0001)' });
          } else {
            const objective = await prisma.investmentObjective.findFirst({
              where: { sn: objectiveSn, deletedAt: null },
            });
            if (!objective) {
              rowErrors.push({ row: rowNum, field: 'objectiveId', message: 'Objective not found' });
            } else {
              (row as any)._objectiveId = objective.id; // Store UUID for import
            }
          }
        }

        // Validate dates
        if (row.startDate && !this.isValidDate(row.startDate)) {
          rowErrors.push({ row: rowNum, field: 'startDate', message: 'Invalid date format (use YYYY-MM-DD)' });
        }
        if (row.endDate && !this.isValidDate(row.endDate)) {
          rowErrors.push({ row: rowNum, field: 'endDate', message: 'Invalid date format (use YYYY-MM-DD)' });
        }
        if (row.startDate && row.endDate && new Date(row.endDate) < new Date(row.startDate)) {
          rowErrors.push({ row: rowNum, field: 'endDate', message: 'End date must be after start date' });
        }

        // Validate status enum
        if (row.status && !ACTIVITY_STATUSES.includes(row.status as ActivityStatus)) {
          rowErrors.push({
            row: rowNum,
            field: 'status',
            message: `Must be one of: ${ACTIVITY_STATUSES.join(', ')}`,
          });
        }

        // Validate progress percent
        if (row.progressPercent !== undefined) {
          const progress = Number(row.progressPercent);
          if (isNaN(progress) || progress < 0 || progress > 100) {
            rowErrors.push({ row: rowNum, field: 'progressPercent', message: 'Must be between 0 and 100' });
          }
        }

        // Validate risk rating
        if (row.riskRating && !RISK_RATINGS.includes(row.riskRating as any)) {
          rowErrors.push({
            row: rowNum,
            field: 'riskRating',
            message: `Must be one of: ${RISK_RATINGS.join(', ')}`,
          });
        }

        // Validate priority
        if (row.priority && !PRIORITY_LEVELS.includes(row.priority as any)) {
          rowErrors.push({
            row: rowNum,
            field: 'priority',
            message: `Must be one of: ${PRIORITY_LEVELS.join(', ')}`,
          });
        }

        // Validate estimated spend
        if (row.estimatedSpendUsd !== undefined) {
          const spend = Number(row.estimatedSpendUsd);
          if (isNaN(spend) || spend < 0) {
            rowErrors.push({ row: rowNum, field: 'estimatedSpendUsd', message: 'Must be a positive number' });
          }
        }

        // Extract annual estimates from year columns
        const annualEstimates: Record<string, number> = {};
        let annualTotal = 0;
        for (const key in row) {
          if (key.match(/^estimate\d{4}$/i)) {
            const year = key.replace(/estimate/i, '');
            const amount = Number(row[key]);
            if (!isNaN(amount) && amount > 0) {
              annualEstimates[year] = amount;
              annualTotal += amount;
            }
          }
        }

        // Validate annual estimates sum matches total (if both provided)
        if (row.estimatedSpendUsd && Object.keys(annualEstimates).length > 0) {
          const totalSpend = Number(row.estimatedSpendUsd);
          if (Math.abs(annualTotal - totalSpend) > 0.01) {
            rowErrors.push({
              row: rowNum,
              field: 'estimatedSpendUsd',
              message: `Sum of annual estimates ($${annualTotal}) doesn't match total ($${totalSpend})`,
            });
          }
        }

        (row as any)._annualEstimates = annualEstimates;

        if (rowErrors.length === 0) {
          validRows.push(row);
        } else {
          errors.push(...rowErrors);
        }
      }

      return {
        success: errors.length === 0,
        successCount: validRows.length,
        errorCount: errors.length,
        errors,
        preview: validRows.slice(0, 10), // First 10 rows for preview
      };
    } catch (error) {
      console.error('Excel parsing error:', error);
      return {
        success: false,
        successCount: 0,
        errorCount: 1,
        errors: [{ row: 0, field: 'file', message: 'Failed to parse Excel file' }],
      };
    }
  }

  /**
   * Import activities from validated Excel data
   */
  async importActivities(
    filePath: string,
    userId: string,
    userRole: UserRole,
    ipAddress?: string
  ): Promise<ImportResult> {
    const parseResult = await this.parseActivityExcel(filePath);

    if (!parseResult.success || !parseResult.preview) {
      return parseResult;
    }

    const imported: any[] = [];
    const errors: ImportError[] = [];

    for (let i = 0; i < parseResult.preview.length; i++) {
      const row = parseResult.preview[i];
      const rowNum = i + 2;

      try {
        const activity = await prisma.activity.create({
          data: {
            investmentObjectiveId: row._objectiveId,
            title: row.title.trim(),
            descriptionAndObjective: row.description?.trim() || null,
            startDate: row.startDate ? new Date(row.startDate) : new Date(),
            endDate: row.endDate ? new Date(row.endDate) : new Date(),
            status: (row.status as ActivityStatus) || 'Planned',
            progressPercent: row.progressPercent !== undefined ? Number(row.progressPercent) : 0,
            lead: row.lead?.trim() || null,
            estimatedSpendUsdTotal: row.estimatedSpendUsd !== undefined ? Number(row.estimatedSpendUsd) : 0,
            annualEstimates: row._annualEstimates || {},
            riskRating: row.riskRating || null,
            priority: row.priority || null,
            createdById: userId,
            updatedById: userId,
          },
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            actorId: userId,
            actorRole: userRole,
            action: 'Import',
            objectType: 'Activity',
            objectId: activity.id,
            newValues: {
              title: activity.title,
              estimatedSpendUsdTotal: activity.estimatedSpendUsdTotal.toNumber(),
            },
            ipAddress,
          },
        });

        imported.push(activity);
      } catch (error) {
        console.error(`Import error at row ${rowNum}:`, error);
        errors.push({
          row: rowNum,
          field: 'import',
          message: error instanceof Error ? error.message : 'Failed to create activity',
        });
      }
    }

    return {
      success: errors.length === 0,
      successCount: imported.length,
      errorCount: errors.length,
      errors,
    };
  }

  /**
   * Generate Excel template for activity import
   */
  async generateTemplate(): Promise<Buffer> {
    const headers = [
      'objectiveId',
      'title',
      'description',
      'startDate',
      'endDate',
      'status',
      'progressPercent',
      'lead',
      'estimatedSpendUsd',
      'riskRating',
      'priority',
    ];

    // Add year columns (2020-2040)
    for (let year = 2020; year <= 2040; year++) {
      headers.push(`estimate${year}`);
    }

    // Sample data
    const sampleRows = [
      {
        objectiveId: 'OBJ-0001',
        title: 'Sample Activity 1',
        description: 'This is a sample activity description',
        startDate: '2024-01-01',
        endDate: '2025-12-31',
        status: 'Planned',
        progressPercent: 0,
        lead: 'John Doe',
        estimatedSpendUsd: 50000,
        riskRating: 'Medium',
        priority: 'High',
        estimate2024: 20000,
        estimate2025: 30000,
      },
      {
        objectiveId: 'OBJ-0001',
        title: 'Sample Activity 2',
        description: 'Another sample activity',
        startDate: '2024-06-01',
        endDate: '2024-12-31',
        status: 'InProgress',
        progressPercent: 25,
        lead: 'Jane Smith',
        estimatedSpendUsd: 25000,
        riskRating: 'Low',
        priority: 'Medium',
        estimate2024: 25000,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows, { header: headers });

    // Set column widths
    const colWidths = headers.map((h) => ({ wch: h.length > 15 ? 20 : 15 }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Activities');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}

export const importService = new ImportService();
