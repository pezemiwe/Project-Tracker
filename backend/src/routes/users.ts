import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { userService } from '../services/userService.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  role: z.enum(['Admin', 'ProjectManager', 'Finance', 'CommitteeMember', 'Auditor', 'Viewer']),
  temporaryPassword: z.string().min(12),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  fullName: z.string().min(1).optional(),
  role: z.enum(['Admin', 'ProjectManager', 'Finance', 'CommitteeMember', 'Auditor', 'Viewer']).optional(),
  isActive: z.boolean().optional(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(12),
});

export async function userRoutes(fastify: FastifyInstance) {
  // GET /api/users - List users (Admin only)
  fastify.get(
    '/',
    {
      onRequest: [authenticate, requireAdmin],
    },
    async (request, reply) => {
      try {
        const query = request.query as any;
        const filters = {
          role: query.role as UserRole | undefined,
          isActive: query.is_active === 'true' ? true : query.is_active === 'false' ? false : undefined,
          page: query.page ? parseInt(query.page) : undefined,
          limit: query.limit ? parseInt(query.limit) : undefined,
        };

        const result = await userService.getUsers(filters);
        return reply.send(result);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // GET /api/users/:id - Get user by ID (Admin only)
  fastify.get(
    '/:id',
    {
      onRequest: [authenticate, requireAdmin],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = await userService.getUser(id);
        return reply.send(user);
      } catch (error) {
        if (error instanceof Error && error.message === 'User not found') {
          return reply.status(404).send({ error: 'User not found' });
        }
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // POST /api/users - Create user (Admin only)
  fastify.post(
    '/',
    {
      onRequest: [authenticate, requireAdmin],
    },
    async (request, reply) => {
      try {
        const data = createUserSchema.parse(request.body);
        const createdById = request.user!.userId;
        const createdByRole = request.user!.role;
        const ipAddress = request.ip;

        const user = await userService.createUser(data, createdById, createdByRole, ipAddress);

        return reply.status(201).send(user);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation error',
            details: error.errors,
          });
        }

        if (error instanceof Error) {
          if (error.message.includes('already exists')) {
            return reply.status(409).send({ error: error.message });
          }
          if (error.message.includes('Weak password')) {
            return reply.status(400).send({ error: error.message });
          }
        }

        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // PUT /api/users/:id - Update user (Admin only)
  fastify.put(
    '/:id',
    {
      onRequest: [authenticate, requireAdmin],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const data = updateUserSchema.parse(request.body);
        const updatedById = request.user!.userId;
        const updatedByRole = request.user!.role;
        const ipAddress = request.ip;

        const user = await userService.updateUser(id, data, updatedById, updatedByRole, ipAddress);

        return reply.send(user);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation error',
            details: error.errors,
          });
        }

        if (error instanceof Error) {
          if (error.message === 'User not found') {
            return reply.status(404).send({ error: error.message });
          }
          if (error.message.includes('already exists')) {
            return reply.status(409).send({ error: error.message });
          }
        }

        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // PUT /api/users/:id/reset-password - Reset user password (Admin only)
  fastify.put(
    '/:id/reset-password',
    {
      onRequest: [authenticate, requireAdmin],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { newPassword } = resetPasswordSchema.parse(request.body);
        const resetById = request.user!.userId;
        const resetByRole = request.user!.role;
        const ipAddress = request.ip;

        await userService.resetPassword(id, newPassword, resetById, resetByRole, ipAddress);

        return reply.send({ message: 'Password reset successful' });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation error',
            details: error.errors,
          });
        }

        if (error instanceof Error && error.message.includes('Weak password')) {
          return reply.status(400).send({ error: error.message });
        }

        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
}
