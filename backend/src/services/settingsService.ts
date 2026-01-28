import { prisma } from "../utils/prisma.js";

export class SettingsService {
  private cache: Map<string, any> = new Map();

  async getSetting(key: string): Promise<any> {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    if (!setting) return null;

    this.cache.set(key, setting.value);
    return setting.value;
  }

  async setSetting(
    key: string,
    value: any,
    userId: string,
    description?: string,
  ): Promise<void> {
    await prisma.systemSetting.upsert({
      where: { key },
      create: {
        key,
        value,
        description,
        updatedById: userId,
      },
      update: {
        value,
        description,
        updatedById: userId,
        updatedAt: new Date(),
      },
    });

    this.cache.delete(key);
  }

  async getAllSettings(): Promise<any[]> {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: "asc" },
      include: {
        updatedBy: {
          select: {
            fullName: true,
          },
        },
      },
    });

    return settings;
  }

  async deleteSetting(key: string): Promise<void> {
    await prisma.systemSetting.delete({ where: { key } });
    this.cache.delete(key);
  }

  clearCache(): void {
    this.cache.clear();
  }

  async seedDefaultSettings(): Promise<void> {
    const defaultSettings = [
      {
        key: "approvalThresholdUsd",
        value: 10000,
        description: "Budget threshold requiring committee approval (USD)",
      },
      {
        key: "approvalThresholdPercent",
        value: 20,
        description: "Variance threshold requiring committee approval (%)",
      },
      {
        key: "emailNotificationsEnabled",
        value: true,
        description: "Enable email notifications",
      },
      {
        key: "smtpHost",
        value: "",
        description: "SMTP server host",
      },
      {
        key: "smtpPort",
        value: 587,
        description: "SMTP server port",
      },
      {
        key: "smtpUser",
        value: "",
        description: "SMTP username",
      },
      {
        key: "smtpPassword",
        value: "",
        description: "SMTP password (encrypted)",
      },
      {
        key: "emailFromAddress",
        value: "noreply@donor-oversight.org",
        description: "From email address",
      },
      {
        key: "sessionTimeoutMinutes",
        value: 30,
        description: "Idle session timeout (minutes)",
      },
      {
        key: "maxLoginAttempts",
        value: 5,
        description: "Maximum failed login attempts before lockout",
      },
    ];

    for (const setting of defaultSettings) {
      const existing = await prisma.systemSetting.findUnique({
        where: { key: setting.key },
      });

      if (!existing) {
        await prisma.systemSetting.create({
          data: setting,
        });
      }
    }
  }
}

export const settingsService = new SettingsService();
