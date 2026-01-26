import { FastifyInstance } from "fastify";
import { auditService } from "../services/auditService.js";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { z } from "zod";

const auditFiltersSchema = z.object({
  objectType: z.string().optional(),
  objectId: z.string().optional(),
  actorId: z.string().optional(),
  action: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

export async function auditRoutes(fastify: FastifyInstance) {
  // GET /api/audit/logs - Get audit logs (Admin, Auditor)
  fastify.get(
    "/logs",
    {
      onRequest: [authenticate, requireRoles("Admin", "Auditor")],
    },
    async (request, reply) => {
      try {
        const filters = auditFiltersSchema.parse(request.query);
        const result = await auditService.getAuditLogs(
          filters,
          filters.page,
          filters.limit
        );
        return reply.send(result);
      } catch (error) {
        request.log.error(error);
        if (error instanceof z.ZodError) {
          return reply
            .status(400)
            .send({ error: "Invalid filters", details: error.errors });
        }
        return reply.status(500).send({ error: "Failed to fetch audit logs" });
      }
    }
  );

  // GET /api/audit/value-history/:objectType/:objectId/:field
  fastify.get(
    "/value-history/:objectType/:objectId/:field",
    {
      onRequest: [authenticate, requireRoles("Admin", "Auditor")],
    },
    async (request, reply) => {
      try {
        const { objectType, objectId, field } = request.params as any;
        const history = await auditService.getValueHistory(
          objectType,
          objectId,
          field
        );
        return reply.send(history);
      } catch (error) {
        request.log.error(error);
        return reply
          .status(500)
          .send({ error: "Failed to fetch value history" });
      }
    }
  );

  // GET /api/audit/export - Export audit logs as CSV
  fastify.get(
    "/export",
    {
      onRequest: [authenticate, requireRoles("Admin", "Auditor")],
    },
    async (request, reply) => {
      try {
        const filters = auditFiltersSchema.parse(request.query);
        const csv = await auditService.exportAuditLogs(filters);

        reply.header("Content-Type", "text/csv");
        reply.header(
          "Content-Disposition",
          `attachment; filename="audit-logs-${Date.now()}.csv"`
        );

        return reply.send(csv);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "Failed to export audit logs" });
      }
    }
  );

  // GET /api/audit/feed - Get activity feed (All authenticated users)
  fastify.get(
    "/feed",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const { limit } = request.query as { limit?: string };
        const feed = await auditService.getActivityFeed(
          limit ? parseInt(limit) : 20
        );
        return reply.send(feed);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch activity feed" });
      }
    }
  );
}
