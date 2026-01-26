import { FastifyInstance } from 'fastify';
import { exportService } from '../services/exportService.js';
import { authenticate } from '../middleware/auth.js';
import { z } from 'zod';

const exportFiltersSchema = z.object({
  objectiveId: z.string().optional(),
  status: z.string().optional(),
  lead: z.string().optional(),
  startYear: z.coerce.number().optional(),
  endYear: z.coerce.number().optional(),
});

const exportActualsSchema = z.object({
  activityId: z.string().optional(),
});

export async function exportRoutes(fastify: FastifyInstance) {
  // GET /api/export/activities - Export activities to Excel
  fastify.get(
    '/activities',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const filters = exportFiltersSchema.parse(request.query);
        const buffer = await exportService.exportActivities(filters);

        reply.header(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        reply.header(
          'Content-Disposition',
          `attachment; filename="activities-export-${Date.now()}.xlsx"`
        );

        return reply.send(buffer);
      } catch (error) {
        request.log.error(error);
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: 'Invalid query parameters', details: error.errors });
        }
        return reply.status(500).send({ error: 'Export failed' });
      }
    }
  );

  // GET /api/export/actuals - Export actuals to Excel
  fastify.get(
    '/actuals',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const { activityId } = exportActualsSchema.parse(request.query);
        const buffer = await exportService.exportActuals(activityId);

        reply.header(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        reply.header(
          'Content-Disposition',
          `attachment; filename="actuals-export-${Date.now()}.xlsx"`
        );

        return reply.send(buffer);
      } catch (error) {
        request.log.error(error);
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: 'Invalid query parameters', details: error.errors });
        }
        return reply.status(500).send({ error: 'Export failed' });
      }
    }
  );

  // GET /api/export/financial-report - Generate financial summary report
  fastify.get(
    '/financial-report',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const buffer = await exportService.generateFinancialReport();

        reply.header(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        reply.header(
          'Content-Disposition',
          `attachment; filename="financial-report-${Date.now()}.xlsx"`
        );

        return reply.send(buffer);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Report generation failed' });
      }
    }
  );

  // GET /api/export/pdf-report - Generate PDF report
  fastify.get(
    '/pdf-report',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const { objectiveId } = request.query as { objectiveId?: string };
        const buffer = await exportService.generatePDFReport(objectiveId);

        reply.header('Content-Type', 'application/pdf');
        reply.header(
          'Content-Disposition',
          `attachment; filename="portfolio-report-${Date.now()}.pdf"`
        );

        return reply.send(buffer);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'PDF generation failed' });
      }
    }
  );
}
