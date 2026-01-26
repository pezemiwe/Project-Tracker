import { FastifyInstance } from "fastify";
import { dashboardService } from "../services/dashboardService.js";
import { authenticate } from "../middleware/auth.js";
import { z } from "zod";

const ganttFiltersSchema = z.object({
  startYear: z.coerce.number().optional(),
  endYear: z.coerce.number().optional(),
});

export async function dashboardRoutes(fastify: FastifyInstance) {
  // GET /api/dashboard/kpis
  fastify.get(
    "/kpis",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const kpis = await dashboardService.getKPIs();
        return reply.send(kpis);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch KPIs" });
      }
    }
  );

  // GET /api/dashboard/spend-by-year
  fastify.get(
    "/spend-by-year",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const data = await dashboardService.getSpendByYear();
        return reply.send(data);
      } catch (error) {
        request.log.error(error);
        return reply
          .status(500)
          .send({ error: "Failed to fetch spend by year" });
      }
    }
  );

  // GET /api/dashboard/variance-alerts
  fastify.get(
    "/variance-alerts",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const { limit } = request.query as any;
        const alerts = await dashboardService.getVarianceAlerts(
          limit ? parseInt(limit) : 5
        );
        return reply.send(alerts);
      } catch (error) {
        request.log.error(error);
        return reply
          .status(500)
          .send({ error: "Failed to fetch variance alerts" });
      }
    }
  );

  // GET /api/dashboard/gantt
  fastify.get(
    "/gantt",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const filters = ganttFiltersSchema.parse(request.query);
        const data = await dashboardService.getGanttData(filters);
        return reply.send(data);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch Gantt data" });
      }
    }
  );

  // GET /api/dashboard/spend-analysis
  fastify.get(
    "/spend-analysis",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const data = await dashboardService.getSpendAnalysis();
        return reply.send(data);
      } catch (error) {
        request.log.error(error);
        return reply
          .status(500)
          .send({ error: "Failed to fetch spend analysis" });
      }
    }
  );
}
