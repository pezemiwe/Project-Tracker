import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { prisma } from './utils/prisma.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { objectiveRoutes } from './routes/objectives.js';
import { activityRoutes } from './routes/activities.js';
import { approvalRoutes } from './routes/approvals.js';
import { notificationRoutes } from './routes/notifications.js';
import { actualRoutes } from './routes/actuals.js';
import { attachmentRoutes } from './routes/attachments.js';
import { importRoutes } from './routes/import.js';
import { exportRoutes } from './routes/export.js';
import { auditRoutes } from './routes/audit.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { settingsRoutes } from './routes/settings.js';
import { reportRoutes } from './routes/reports.js';
import { commentRoutes } from './routes/comments.js';
import { activityService } from './services/activityService.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

// Add Prisma to Fastify instance
declare module 'fastify' {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}

fastify.decorate('prisma', prisma);

// Register plugins
async function setupPlugins() {
  // CORS
  await fastify.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Cookies
  await fastify.register(cookie, {
    secret: process.env.JWT_SECRET || 'development-secret',
  });

  // Multipart (for file uploads)
  await fastify.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  });
}

// Register routes
async function setupRoutes() {
  // Health check
  fastify.get('/api/health', async () => {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'healthy',
        },
      };
    } catch (error) {
      fastify.log.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'unhealthy',
        },
      };
    }
  });

  // Auth routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });

  // User routes
  await fastify.register(userRoutes, { prefix: '/api/users' });

  // Objective routes
  await fastify.register(objectiveRoutes, { prefix: '/api/objectives' });

  // Activity routes
  await fastify.register(activityRoutes, { prefix: '/api/activities' });

  // Approval routes
  await fastify.register(approvalRoutes, { prefix: '/api/approvals' });

  // Notification routes
  await fastify.register(notificationRoutes, { prefix: '/api/notifications' });

  // Actual routes
  await fastify.register(actualRoutes, { prefix: '/api/actuals' });

  // Attachment routes
  await fastify.register(attachmentRoutes, { prefix: '/api/attachments' });

  // Import routes
  await fastify.register(importRoutes, { prefix: '/api/import' });

  // Export routes
  await fastify.register(exportRoutes, { prefix: '/api/export' });

  // Audit routes
  await fastify.register(auditRoutes, { prefix: '/api/audit' });

  // Dashboard routes
  await fastify.register(dashboardRoutes, { prefix: '/api/dashboard' });

  // Settings routes
  await fastify.register(settingsRoutes, { prefix: '/api/settings' });

  // Report routes
  await fastify.register(reportRoutes, { prefix: '/api/reports' });

  // Comment routes
  await fastify.register(commentRoutes, { prefix: '/api/comments' });
}

// Start server
async function start() {
  try {
    await setupPlugins();
    await setupRoutes();

    await fastify.listen({ port: PORT, host: HOST });

    fastify.log.info(`Server listening on http://${HOST}:${PORT}`);

    // Start lock expiry cleanup job (runs every 5 minutes)
    setInterval(async () => {
      try {
        const cleanedCount = await activityService.cleanupExpiredLocks();
        if (cleanedCount > 0) {
          fastify.log.info(`Cleaned up ${cleanedCount} expired activity locks`);
        }
      } catch (error) {
        fastify.log.error('Lock cleanup job failed:', error);
      }
    }, 5 * 60 * 1000);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  fastify.log.info('SIGINT received, closing server...');
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  fastify.log.info('SIGTERM received, closing server...');
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

start();
