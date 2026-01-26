import { FastifyInstance } from 'fastify';
import { notificationService } from '../services/notificationService.js';
import { authenticate } from '../middleware/auth.js';

export async function notificationRoutes(fastify: FastifyInstance) {
  // GET /api/notifications - Get user's notifications
  fastify.get(
    '/',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const query = request.query as any;
        const limit = query.limit ? parseInt(query.limit) : 50;

        const notifications = await notificationService.getUserNotifications(user.id, limit);
        return reply.send(notifications);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // GET /api/notifications/unread-count - Get unread count
  fastify.get(
    '/unread-count',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const count = await notificationService.getUnreadCount(user.id);
        return reply.send({ count });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // PATCH /api/notifications/:id/read - Mark notification as read
  fastify.patch(
    '/:id/read',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = (request as any).user;

        const notification = await notificationService.markAsRead(id, user.id);
        return reply.send(notification);
      } catch (error) {
        if (error instanceof Error && error.message === 'Notification not found') {
          return reply.status(404).send({ error: 'Notification not found' });
        }
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // POST /api/notifications/mark-all-read - Mark all notifications as read
  fastify.post(
    '/mark-all-read',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        await notificationService.markAllAsRead(user.id);
        return reply.send({ success: true });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // DELETE /api/notifications/:id - Delete notification
  fastify.delete(
    '/:id',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = (request as any).user;

        await notificationService.deleteNotification(id, user.id);
        return reply.send({ success: true });
      } catch (error) {
        if (error instanceof Error && error.message === 'Notification not found') {
          return reply.status(404).send({ error: 'Notification not found' });
        }
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
}
