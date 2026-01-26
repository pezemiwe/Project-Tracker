import { FastifyInstance } from 'fastify';
import { importService } from '../services/importService.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import fs from 'fs/promises';
import path from 'path';

export async function importRoutes(fastify: FastifyInstance) {
  // GET /api/import/template - Download import template
  fastify.get(
    '/template',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const buffer = await importService.generateTemplate();

        reply.header(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        reply.header('Content-Disposition', `attachment; filename="activity-import-template.xlsx"`);

        return reply.send(buffer);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Failed to generate template' });
      }
    }
  );

  // POST /api/import/activities/preview - Preview import without committing
  fastify.post(
    '/activities/preview',
    {
      onRequest: [authenticate, requireAdmin],
    },
    async (request, reply) => {
      try {
        const data = await request.file();
        if (!data) {
          return reply.status(400).send({ error: 'No file uploaded' });
        }

        // Validate file type
        if (!data.mimetype.includes('spreadsheet') && !data.filename.endsWith('.xlsx')) {
          return reply.status(400).send({ error: 'Invalid file type. Please upload an Excel file (.xlsx)' });
        }

        // Save to temp location
        const tempPath = path.join('/tmp', `${Date.now()}-${data.filename}`);
        const buffer = await data.toBuffer();
        await fs.writeFile(tempPath, buffer);

        const result = await importService.parseActivityExcel(tempPath);

        // Cleanup
        await fs.unlink(tempPath).catch(() => {});

        return reply.send(result);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Import preview failed' });
      }
    }
  );

  // POST /api/import/activities - Execute import
  fastify.post(
    '/activities',
    {
      onRequest: [authenticate, requireAdmin],
    },
    async (request, reply) => {
      try {
        const data = await request.file();
        if (!data) {
          return reply.status(400).send({ error: 'No file uploaded' });
        }

        // Validate file type
        if (!data.mimetype.includes('spreadsheet') && !data.filename.endsWith('.xlsx')) {
          return reply.status(400).send({ error: 'Invalid file type. Please upload an Excel file (.xlsx)' });
        }

        const userId = request.user!.userId;
        const userRole = request.user!.role;
        const ipAddress = request.ip;

        // Save to temp location
        const tempPath = path.join('/tmp', `${Date.now()}-${data.filename}`);
        const buffer = await data.toBuffer();
        await fs.writeFile(tempPath, buffer);

        const result = await importService.importActivities(tempPath, userId, userRole, ipAddress);

        // Cleanup
        await fs.unlink(tempPath).catch(() => {});

        if (result.success) {
          return reply.status(201).send(result);
        } else {
          return reply.status(400).send(result);
        }
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Import failed' });
      }
    }
  );
}
