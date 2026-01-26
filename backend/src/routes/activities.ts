import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ActivityStatus } from '@prisma/client';
import { activityService } from '../services/activityService.js';
import { authenticate, requirePM } from '../middleware/auth.js';

const createActivitySchema = z.object({
  investmentObjectiveId: z.string().uuid(),
  title: z.string().min(1).max(500),
  descriptionAndObjective: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['Planned', 'InProgress', 'OnHold', 'Completed', 'Cancelled']).optional(),
  progressPercent: z.number().int().min(0).max(100).optional(),
  lead: z.string().max(255).optional(),
  estimatedSpendUsdTotal: z.number().optional(),
  riskRating: z.string().max(50).optional(),
  priority: z.string().max(50).optional(),
});

const updateActivitySchema = z.object({
  title: z.string().min(1).max(500).optional(),
  descriptionAndObjective: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['Planned', 'InProgress', 'OnHold', 'Completed', 'Cancelled']).optional(),
  progressPercent: z.number().int().min(0).max(100).optional(),
  lead: z.string().max(255).optional(),
  estimatedSpendUsdTotal: z.number().optional(),
  riskRating: z.string().max(50).optional(),
  priority: z.string().max(50).optional(),
});

export async function activityRoutes(fastify: FastifyInstance) {
  // GET /api/activities - List activities
  fastify.get(
    '/',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const query = request.query as any;
        const filters = {
          investmentObjectiveId: query.objectiveId as string | undefined,
          status: query.status as ActivityStatus | undefined,
          lead: query.lead as string | undefined,
          startYear: query.startYear ? parseInt(query.startYear) : undefined,
          endYear: query.endYear ? parseInt(query.endYear) : undefined,
          page: query.page ? parseInt(query.page) : undefined,
          limit: query.limit ? parseInt(query.limit) : undefined,
          sortBy: query.sortBy as string | undefined,
          sortOrder: (query.sortOrder === 'asc' || query.sortOrder === 'desc') ? query.sortOrder : undefined,
        };

        const result = await activityService.getActivities(filters);
        return reply.send(result);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // GET /api/activities/:id - Get activity by ID
  fastify.get(
    '/:id',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const activity = await activityService.getActivity(id);
        return reply.send(activity);
      } catch (error) {
        if (error instanceof Error && error.message === 'Activity not found') {
          return reply.status(404).send({ error: 'Activity not found' });
        }
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // GET /api/activities/:id/lock-status - Get lock status
  fastify.get(
    '/:id/lock-status',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const lockStatus = await activityService.getLockStatus(id);
        return reply.send(lockStatus);
      } catch (error) {
        if (error instanceof Error && error.message === 'Activity not found') {
          return reply.status(404).send({ error: 'Activity not found' });
        }
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // POST /api/activities/:id/lock - Lock activity
  fastify.post(
    '/:id/lock',
    {
      onRequest: [authenticate, requirePM],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.user!.userId;

        const lockInfo = await activityService.lockActivity(id, userId);
        return reply.send(lockInfo);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Activity not found') {
            return reply.status(404).send({ error: error.message });
          }
          if (error.message.includes('locked by')) {
            return reply.status(409).send({ error: error.message });
          }
        }
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // POST /api/activities/:id/unlock - Unlock activity
  fastify.post(
    '/:id/unlock',
    {
      onRequest: [authenticate, requirePM],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.user!.userId;

        await activityService.unlockActivity(id, userId);
        return reply.send({ message: 'Activity unlocked successfully' });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Activity not found') {
            return reply.status(404).send({ error: error.message });
          }
          if (error.message.includes('Cannot unlock')) {
            return reply.status(403).send({ error: error.message });
          }
        }
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // POST /api/activities - Create activity (PM/Admin only)
  fastify.post(
    '/',
    {
      onRequest: [authenticate, requirePM],
    },
    async (request, reply) => {
      try {
        const data = createActivitySchema.parse(request.body);
        const createdById = request.user!.userId;
        const createdByRole = request.user!.role;
        const ipAddress = request.ip;

        // Convert date strings to Date objects
        const activityData = {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        };

        const activity = await activityService.createActivity(activityData, createdById, createdByRole, ipAddress);

        return reply.status(201).send(activity);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation error',
            details: error.errors,
          });
        }

        if (error instanceof Error && error.message === 'Investment objective not found') {
          return reply.status(404).send({ error: error.message });
        }

        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // PUT /api/activities/:id - Update activity (PM/Admin only, requires lock)
  fastify.put(
    '/:id',
    {
      onRequest: [authenticate, requirePM],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const data = updateActivitySchema.parse(request.body);
        const updatedById = request.user!.userId;
        const updatedByRole = request.user!.role;
        const ipAddress = request.ip;

        // Convert date strings to Date objects
        const activityData = {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        };

        const activity = await activityService.updateActivity(id, activityData, updatedById, updatedByRole, ipAddress);

        return reply.send(activity);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation error',
            details: error.errors,
          });
        }

        if (error instanceof Error) {
          if (error.message === 'Activity not found') {
            return reply.status(404).send({ error: error.message });
          }
          if (error.message === 'Activity is locked by another user') {
            return reply.status(409).send({ error: error.message });
          }
        }

        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // DELETE /api/activities/:id - Delete activity (PM/Admin only)
  fastify.delete(
    '/:id',
    {
      onRequest: [authenticate, requirePM],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const deletedById = request.user!.userId;
        const deletedByRole = request.user!.role;
        const ipAddress = request.ip;

        await activityService.deleteActivity(id, deletedById, deletedByRole, ipAddress);

        return reply.send({ message: 'Activity deleted successfully' });
      } catch (error) {
        if (error instanceof Error && error.message === 'Activity not found') {
          return reply.status(404).send({ error: error.message });
        }

        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
}
