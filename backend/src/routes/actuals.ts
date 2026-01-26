import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { actualService } from '../services/actualService.js';
import { authenticate, requireFinance } from '../middleware/auth.js';

const createActualSchema = z.object({
  activityId: z.string().uuid(),
  entryDate: z.string().datetime(),
  amountUsd: z.number().positive(),
  category: z.string().min(1).max(100),
  description: z.string().optional(),
});

const updateActualSchema = z.object({
  entryDate: z.string().datetime().optional(),
  amountUsd: z.number().positive().optional(),
  category: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
});

export async function actualRoutes(fastify: FastifyInstance) {
  // GET /api/actuals - List actuals by activity
  fastify.get(
    '/',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const query = request.query as any;
        const activityId = query.activityId as string;

        if (!activityId) {
          return reply.status(400).send({ error: 'activityId query parameter is required' });
        }

        const actuals = await actualService.getActualsByActivity(activityId);
        return reply.send(actuals);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // POST /api/actuals - Create actual (Finance/Admin only)
  fastify.post(
    '/',
    {
      onRequest: [authenticate, requireFinance],
    },
    async (request, reply) => {
      try {
        const data = createActualSchema.parse(request.body);
        const createdById = request.user!.userId;
        const createdByRole = request.user!.role;
        const ipAddress = request.ip;

        // Convert date string to Date object
        const actualData = {
          ...data,
          entryDate: new Date(data.entryDate),
        };

        const actual = await actualService.createActual(
          actualData,
          createdById,
          createdByRole,
          ipAddress
        );

        return reply.status(201).send(actual);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation error',
            details: error.errors,
          });
        }

        if (error instanceof Error && error.message === 'Activity not found') {
          return reply.status(404).send({ error: error.message });
        }

        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // PATCH /api/actuals/:id - Update actual (Finance/Admin only)
  fastify.patch(
    '/:id',
    {
      onRequest: [authenticate, requireFinance],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const data = updateActualSchema.parse(request.body);
        const updatedById = request.user!.userId;
        const updatedByRole = request.user!.role;
        const ipAddress = request.ip;

        // Convert date string to Date object if provided
        const actualData = {
          ...data,
          entryDate: data.entryDate ? new Date(data.entryDate) : undefined,
        };

        const actual = await actualService.updateActual(
          id,
          actualData,
          updatedById,
          updatedByRole,
          ipAddress
        );

        return reply.send(actual);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation error',
            details: error.errors,
          });
        }

        if (error instanceof Error && error.message === 'Actual not found') {
          return reply.status(404).send({ error: error.message });
        }

        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // DELETE /api/actuals/:id - Delete actual (Finance/Admin only)
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

        await actualService.deleteActual(id, deletedById, deletedByRole, ipAddress);

        return reply.send({ message: 'Actual deleted successfully' });
      } catch (error) {
        if (error instanceof Error && error.message === 'Actual not found') {
          return reply.status(404).send({ error: error.message });
        }

        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
}
