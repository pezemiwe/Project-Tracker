import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authService } from '../services/authService.js';
import { verifyRefreshToken, generateAccessToken } from '../utils/jwt.js';
import { authenticate } from '../middleware/auth.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function authRoutes(fastify: FastifyInstance) {
  // POST /api/auth/login
  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);
      const ipAddress = request.ip;

      const result = await authService.login(email, password, ipAddress);

      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      if (error instanceof Error && error.message === 'Invalid credentials') {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // POST /api/auth/refresh
  fastify.post('/refresh', async (request, reply) => {
    try {
      const { refreshToken } = refreshSchema.parse(request.body);

      const payload = verifyRefreshToken(refreshToken);

      // Generate new access token
      const accessToken = generateAccessToken({
        userId: payload.userId,
        email: '', // Will be fetched from DB in production
        role: 'Viewer' as any, // Will be fetched from DB in production
      });

      // TODO: Fetch user from DB to get current email and role
      // For now, return basic token

      return reply.send({ accessToken });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      if (error instanceof Error && error.message.includes('Invalid or expired')) {
        return reply.status(401).send({ error: 'Invalid or expired refresh token' });
      }

      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // POST /api/auth/logout
  fastify.post(
    '/logout',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user!.userId;
        const ipAddress = request.ip;

        await authService.logout(userId, ipAddress);

        return reply.send({ message: 'Logged out successfully' });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // GET /api/auth/me - Get current user info
  fastify.get(
    '/me',
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user!.userId;

        const user = await fastify.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
          },
        });

        if (!user || !user.isActive) {
          return reply.status(404).send({ error: 'User not found' });
        }

        return reply.send(user);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
}
