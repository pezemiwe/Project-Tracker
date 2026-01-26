import { FastifyInstance } from "fastify";
import { settingsService } from "../services/settingsService.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { z } from "zod";

const updateSettingSchema = z.object({
  value: z.any(),
  description: z.string().optional(),
});

const createSettingSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  description: z.string().optional(),
});

export async function settingsRoutes(fastify: FastifyInstance) {
  // GET /api/settings - Get all settings (Admin only)
  fastify.get(
    "/",
    {
      onRequest: [authenticate, requireRole("Admin")],
    },
    async (request, reply) => {
      try {
        const settings = await settingsService.getAllSettings();
        return reply.send(settings);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch settings" });
      }
    }
  );

  // GET /api/settings/:key - Get specific setting (Authenticated users)
  fastify.get(
    "/:key",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const { key } = request.params as { key: string };
        const value = await settingsService.getSetting(key);

        if (value === null) {
          return reply.status(404).send({ error: "Setting not found" });
        }

        return reply.send({ key, value });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch setting" });
      }
    }
  );

  // PUT /api/settings/:key - Update setting (Admin only)
  fastify.put(
    "/:key",
    {
      onRequest: [authenticate, requireRole("Admin")],
    },
    async (request, reply) => {
      try {
        const { key } = request.params as { key: string };
        const body = updateSettingSchema.parse(request.body);
        const userId = (request.user as any).id;

        await settingsService.setSetting(
          key,
          body.value,
          userId,
          body.description
        );

        return reply.send({ success: true });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "Failed to update setting" });
      }
    }
  );

  // POST /api/settings - Create new setting (Admin only)
  fastify.post(
    "/",
    {
      onRequest: [authenticate, requireRole("Admin")],
    },
    async (request, reply) => {
      try {
        const body = createSettingSchema.parse(request.body);
        const userId = (request.user as any).id;

        await settingsService.setSetting(
          body.key,
          body.value,
          userId,
          body.description
        );

        return reply.status(201).send({ success: true });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "Failed to create setting" });
      }
    }
  );

  // DELETE /api/settings/:key - Delete setting (Admin only)
  fastify.delete(
    "/:key",
    {
      onRequest: [authenticate, requireRole("Admin")],
    },
    async (request, reply) => {
      try {
        const { key } = request.params as { key: string };
        await settingsService.deleteSetting(key);
        return reply.send({ success: true });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "Failed to delete setting" });
      }
    }
  );

  // POST /api/settings/seed - Seed default settings (Admin only)
  fastify.post(
    "/seed",
    {
      onRequest: [authenticate, requireRole("Admin")],
    },
    async (request, reply) => {
      try {
        await settingsService.seedDefaultSettings();
        return reply.send({ success: true });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "Failed to seed settings" });
      }
    }
  );

  // POST /api/settings/test-email - Test email configuration (Admin only)
  fastify.post(
    "/test-email",
    {
      onRequest: [authenticate, requireRole("Admin")],
    },
    async (request, reply) => {
      try {
        const { testEmail } = request.body as { testEmail: string };

        if (!testEmail) {
          return reply.status(400).send({ error: "Email address required" });
        }

        // Import emailService here to avoid circular dependencies
        const { emailService } = await import("../services/emailService.js");

        // Test SMTP connection first
        const connectionOk = await emailService.testConnection();
        if (!connectionOk) {
          return reply
            .status(500)
            .send({ error: "SMTP connection failed. Check your settings." });
        }

        // Send test email
        await emailService.sendEmail({
          to: testEmail,
          subject: "Test Email from Donor Oversight System",
          html: `
            <h2>Test Email</h2>
            <p>This is a test email from the Donor Oversight System.</p>
            <p>If you received this email, your SMTP configuration is working correctly.</p>
            <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
          `,
        });

        return reply.send({
          success: true,
          message: "Test email sent successfully",
        });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(500).send({
          error: error.message || "Failed to send test email",
        });
      }
    }
  );
}
