import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { commentService } from '../services/commentService.js';
import { authenticate } from '../middleware/auth.js';

const createCommentSchema = z.object({
  activityId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  parentId: z.string().uuid().optional(),
});

const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function commentRoutes(fastify: FastifyInstance) {
  // GET /api/comments/activity/:activityId - List comments for an activity
  fastify.get(
    '/activity/:activityId',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const { activityId } = request.params as { activityId: string };
        const comments = await commentService.getCommentsByActivityId(activityId);
        return reply.send(comments);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // POST /api/comments - Create comment
  fastify.post(
    '/',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const data = createCommentSchema.parse(request.body);
        const userId = request.user!.userId;
        const userRole = request.user!.role;
        const ipAddress = request.ip;

        const comment = await commentService.createComment(data, userId, userRole, ipAddress);

        return reply.status(201).send(comment);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation error',
            details: error.errors,
          });
        }

        if (error instanceof Error && (error.message === 'Activity not found' || error.message === 'Parent comment not found')) {
          return reply.status(404).send({ error: error.message });
        }

        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // PUT /api/comments/:id - Update comment
  fastify.put(
    '/:id',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const data = updateCommentSchema.parse(request.body);
        const userId = request.user!.userId;
        const userRole = request.user!.role;
        const ipAddress = request.ip;

        const comment = await commentService.updateComment(id, data, userId, userRole, ipAddress);

        return reply.send(comment);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation error',
            details: error.errors,
          });
        }

        if (error instanceof Error) {
          if (error.message === 'Comment not found') {
            return reply.status(404).send({ error: error.message });
          }
          if (error.message === 'Unauthorized to update this comment') {
            return reply.status(403).send({ error: error.message });
          }
        }

        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // DELETE /api/comments/:id - Delete comment
  fastify.delete(
    '/:id',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.user!.userId;
        const userRole = request.user!.role;
        const ipAddress = request.ip;

        await commentService.deleteComment(id, userId, userRole, ipAddress);

        return reply.send({ message: 'Comment deleted successfully' });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Comment not found') {
            return reply.status(404).send({ error: error.message });
          }
          if (error.message === 'Unauthorized to delete this comment') {
            return reply.status(403).send({ error: error.message });
          }
        }

        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
}
