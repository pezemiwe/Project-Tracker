import { FastifyInstance } from "fastify";
import { reportService } from "../services/reportService.js";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { z } from "zod";

const auditReportFiltersSchema = z.object({
  objectType: z.string().optional(),
  action: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function reportRoutes(fastify: FastifyInstance) {
  // GET /api/reports/financial - Generate financial summary report
  fastify.get(
    "/financial",
    {
      onRequest: [authenticate], // Any authenticated user
    },
    async (request, reply) => {
      try {
        const pdfBuffer = await reportService.generateFinancialReport();

        reply
          .header("Content-Type", "application/pdf")
          .header(
            "Content-Disposition",
            `attachment; filename="financial-report-${new Date().toISOString().split("T")[0]}.pdf"`
          )
          .send(pdfBuffer);
      } catch (error) {
        request.log.error(error);
        return reply
          .status(500)
          .send({ error: "Failed to generate financial report" });
      }
    }
  );

  // GET /api/reports/audit - Generate audit trail report
  fastify.get(
    "/audit",
    {
      onRequest: [authenticate, requireRoles("Admin", "Auditor")],
    },
    async (request, reply) => {
      try {
        const filters = auditReportFiltersSchema.parse(request.query);
        const pdfBuffer = await reportService.generateAuditReport(filters);

        reply
          .header("Content-Type", "application/pdf")
          .header(
            "Content-Disposition",
            `attachment; filename="audit-report-${new Date().toISOString().split("T")[0]}.pdf"`
          )
          .send(pdfBuffer);
      } catch (error) {
        request.log.error(error);
        return reply
          .status(500)
          .send({ error: "Failed to generate audit report" });
      }
    }
  );

  // GET /api/reports/activities - Generate activity status report
  fastify.get(
    "/activities",
    {
      onRequest: [
        authenticate,
        requireRoles("ProjectManager", "Finance", "Admin", "CommitteeMember"),
      ],
    },
    async (request, reply) => {
      try {
        const pdfBuffer = await reportService.generateActivityReport();

        reply
          .header("Content-Type", "application/pdf")
          .header(
            "Content-Disposition",
            `attachment; filename="activity-report-${new Date().toISOString().split("T")[0]}.pdf"`
          )
          .send(pdfBuffer);
      } catch (error) {
        request.log.error(error);
        return reply
          .status(500)
          .send({ error: "Failed to generate activity report" });
      }
    }
  );
}
