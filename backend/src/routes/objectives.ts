import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { objectiveService } from '../services/objectiveService.js';
import { authenticate, requirePM } from '../middleware/auth.js';

const createObjectiveSchema = z.object({
  title: z.string().min(1).max(500),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  states: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  overallStartYear: z.number().int().min(2020).max(2050),
  overallEndYear: z.number().int().min(2020).max(2050),
  status: z.string().max(50).optional(),
}).refine(data => data.overallEndYear >= data.overallStartYear, {
  message: 'End year must be greater than or equal to start year',
});

const updateObjectiveSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  states: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  overallStartYear: z.number().int().min(2020).max(2050).optional(),
  overallEndYear: z.number().int().min(2020).max(2050).optional(),
  status: z.string().max(50).optional(),
});

export async function objectiveRoutes(fastify: FastifyInstance) {
  // GET /api/objectives - List objectives
  fastify.get(
    '/',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const query = request.query as any;
        const filters = {
          status: query.status as string | undefined,
          region: query.region as string | undefined,
          state: query.state as string | undefined,
          startYear: query.startYear ? parseInt(query.startYear) : undefined,
          endYear: query.endYear ? parseInt(query.endYear) : undefined,
          page: query.page ? parseInt(query.page) : undefined,
          limit: query.limit ? parseInt(query.limit) : undefined,
          sortBy: query.sortBy as string | undefined,
          sortOrder: (query.sortOrder === 'asc' || query.sortOrder === 'desc') ? query.sortOrder : undefined,
        };

        const result = await objectiveService.getObjectives(filters);
        return reply.send(result);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // GET /api/objectives/:id - Get objective by ID
  fastify.get(
    '/:id',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const objective = await objectiveService.getObjective(id);
        return reply.send(objective);
      } catch (error) {
        if (error instanceof Error && error.message === 'Objective not found') {
          return reply.status(404).send({ error: 'Objective not found' });
        }
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // POST /api/objectives - Create objective (PM/Admin only)
  fastify.post(
    '/',
    {
      onRequest: [authenticate, requirePM],
    },
    async (request, reply) => {
      try {
        const data = createObjectiveSchema.parse(request.body);
        const createdById = request.user!.userId;
        const createdByRole = request.user!.role;
        const ipAddress = request.ip;

        const objective = await objectiveService.createObjective(data, createdById, createdByRole, ipAddress);

        return reply.status(201).send(objective);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation error',
            details: error.errors,
          });
        }

        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // PUT /api/objectives/:id - Update objective (PM/Admin only)
  fastify.put(
    '/:id',
    {
      onRequest: [authenticate, requirePM],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const data = updateObjectiveSchema.parse(request.body);
        const updatedById = request.user!.userId;
        const updatedByRole = request.user!.role;
        const ipAddress = request.ip;

        // Validate year range if both provided
        if (data.overallStartYear && data.overallEndYear && data.overallEndYear < data.overallStartYear) {
          return reply.status(400).send({ error: 'End year must be greater than or equal to start year' });
        }

        const objective = await objectiveService.updateObjective(id, data, updatedById, updatedByRole, ipAddress);

        return reply.send(objective);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation error',
            details: error.errors,
          });
        }

        if (error instanceof Error && error.message === 'Objective not found') {
          return reply.status(404).send({ error: error.message });
        }

        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // DELETE /api/objectives/:id - Delete objective (PM/Admin only)
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

        await objectiveService.deleteObjective(id, deletedById, deletedByRole, ipAddress);

        return reply.send({ message: 'Objective deleted successfully' });
      } catch (error) {
        if (error instanceof Error && error.message === 'Objective not found') {
          return reply.status(404).send({ error: error.message });
        }

        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // GET /api/objectives/:id/aggregates - Get per-year aggregates
  fastify.get(
    '/:id/aggregates',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const aggregates = await objectiveService.getObjectiveAggregates(id);

        return reply.send(aggregates);
      } catch (error) {
        if (error instanceof Error && error.message === 'Objective not found') {
          return reply.status(404).send({ error: error.message });
        }

        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
}
