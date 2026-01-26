import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { approvalService } from '../services/approvalService.js';
import { authenticate, requireFinance, requireCommittee } from '../middleware/auth.js';
import { ApprovalState, ApprovalTargetType } from '@prisma/client';

const submitApprovalSchema = z.object({
  targetType: z.enum(['EstimateChange', 'ActualEntry', 'StatusChange']),
  targetId: z.string().uuid(),
  oldValue: z.number().optional(),
  newValue: z.number().optional(),
  comment: z.string().optional(),
});

const approvalActionSchema = z.object({
  comment: z.string().optional(),
});

const rejectApprovalSchema = z.object({
  reason: z.string().min(1),
});

export async function approvalRoutes(fastify: FastifyInstance) {
  // POST /api/approvals - Submit approval
  fastify.post(
    '/',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const data = submitApprovalSchema.parse(request.body);
        const user = (request as any).user;
        const ipAddress = request.ip;

        const approval = await approvalService.submitApproval(
          data,
          user.id,
          user.role,
          ipAddress
        );

        return reply.status(201).send(approval);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: 'Validation error', details: error.errors });
        }
        if (error instanceof Error) {
          request.log.error(error);
          return reply.status(400).send({ error: error.message });
        }
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // POST /api/approvals/:id/finance-approve
  fastify.post(
    '/:id/finance-approve',
    {
      onRequest: [authenticate, requireFinance],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const data = approvalActionSchema.parse(request.body);
        const user = (request as any).user;
        const ipAddress = request.ip;

        const approval = await approvalService.financeApprove(
          id,
          user.id,
          user.role,
          data,
          ipAddress
        );

        return reply.send(approval);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: 'Validation error', details: error.errors });
        }
        if (error instanceof Error) {
          request.log.error(error);
          return reply.status(400).send({ error: error.message });
        }
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // POST /api/approvals/:id/committee-approve
  fastify.post(
    '/:id/committee-approve',
    {
      onRequest: [authenticate, requireCommittee],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const data = approvalActionSchema.parse(request.body);
        const user = (request as any).user;
        const ipAddress = request.ip;

        const approval = await approvalService.committeeApprove(
          id,
          user.id,
          user.role,
          data,
          ipAddress
        );

        return reply.send(approval);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: 'Validation error', details: error.errors });
        }
        if (error instanceof Error) {
          request.log.error(error);
          return reply.status(400).send({ error: error.message });
        }
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // POST /api/approvals/:id/reject
  fastify.post(
    '/:id/reject',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const data = rejectApprovalSchema.parse(request.body);
        const user = (request as any).user;
        const ipAddress = request.ip;

        // Check user has Finance or Committee role
        if (!['Finance', 'CommitteeMember', 'Admin'].includes(user.role)) {
          return reply.status(403).send({ error: 'Forbidden' });
        }

        const approval = await approvalService.rejectApproval(
          id,
          user.id,
          user.role,
          data,
          ipAddress
        );

        return reply.send(approval);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: 'Validation error', details: error.errors });
        }
        if (error instanceof Error) {
          request.log.error(error);
          return reply.status(400).send({ error: error.message });
        }
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // GET /api/approvals - List approvals with filters
  fastify.get(
    '/',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const query = request.query as any;
        const filters: {
          state?: ApprovalState;
          targetType?: ApprovalTargetType;
          targetId?: string;
          submittedById?: string;
        } = {};

        if (query.state) {
          filters.state = query.state as ApprovalState;
        }
        if (query.targetType) {
          filters.targetType = query.targetType as ApprovalTargetType;
        }
        if (query.targetId) {
          filters.targetId = query.targetId;
        }
        if (query.submittedById) {
          filters.submittedById = query.submittedById;
        }

        const approvals = await approvalService.getApprovals(filters);
        return reply.send(approvals);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // GET /api/approvals/pending - Get pending approvals for user
  fastify.get(
    '/pending',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const approvals = await approvalService.getPendingApprovals(user.id, user.role);
        return reply.send(approvals);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // GET /api/approvals/:id - Get approval by ID
  fastify.get(
    '/:id',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const approval = await approvalService.getApprovalById(id);

        if (!approval) {
          return reply.status(404).send({ error: 'Approval not found' });
        }

        return reply.send(approval);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
}
