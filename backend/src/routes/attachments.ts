import { FastifyInstance } from 'fastify';
import { attachmentService } from '../services/attachmentService.js';
import { authenticate, requireFinance } from '../middleware/auth.js';

export async function attachmentRoutes(fastify: FastifyInstance) {
  // POST /api/attachments - Upload attachment (Finance/Admin only)
  fastify.post(
    '/',
    {
      onRequest: [authenticate, requireFinance],
    },
    async (request, reply) => {
      try {
        const data = await request.file();

        if (!data) {
          return reply.status(400).send({ error: 'No file uploaded' });
        }

        // Get actualId from form data
        const actualIdField = data.fields.actualId;
        const actualId = actualIdField && 'value' in actualIdField ? actualIdField.value : null;

        if (!actualId || typeof actualId !== 'string') {
          return reply.status(400).send({ error: 'actualId is required' });
        }

        const uploadedById = request.user!.userId;
        const uploadedByRole = request.user!.role;
        const ipAddress = request.ip;

        // Save file to temp location
        const tempPath = `/tmp/${Date.now()}-${data.filename}`;
        const fs = await import('fs/promises');
        const buffer = await data.toBuffer();
        await fs.writeFile(tempPath, buffer);

        const file = {
          filepath: tempPath,
          originalFilename: data.filename,
          mimetype: data.mimetype,
          size: buffer.length,
        };

        const attachment = await attachmentService.uploadAttachment(
          file,
          actualId,
          uploadedById,
          uploadedByRole,
          ipAddress
        );

        return reply.status(201).send(attachment);
      } catch (error) {
        if (error instanceof Error && error.message.includes('infected')) {
          return reply.status(400).send({ error: error.message });
        }

        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // GET /api/attachments/:id/download - Get download URL
  fastify.get(
    '/:id/download',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.user!.userId;

        const url = await attachmentService.getDownloadUrl(id, userId);

        return reply.send({ url });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Attachment not found') {
            return reply.status(404).send({ error: error.message });
          }
          if (error.message.includes('infected')) {
            return reply.status(403).send({ error: error.message });
          }
        }

        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // DELETE /api/attachments/:id - Delete attachment (Finance/Admin only)
  fastify.delete(
    '/:id',
    {
      onRequest: [authenticate, requireFinance],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const deletedById = request.user!.userId;
        const deletedByRole = request.user!.role;
        const ipAddress = request.ip;

        await attachmentService.deleteAttachment(id, deletedById, deletedByRole, ipAddress);

        return reply.send({ message: 'Attachment deleted successfully' });
      } catch (error) {
        if (error instanceof Error && error.message === 'Attachment not found') {
          return reply.status(404).send({ error: error.message });
        }

        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
}
