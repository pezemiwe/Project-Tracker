import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsService } from '../settingsService.js';
import { prisma } from '../../utils/prisma.js';

// Mock Prisma
vi.mock('../../utils/prisma.js', () => ({
  prisma: {
    systemSetting: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('SettingsService', () => {
  let settingsService: SettingsService;

  beforeEach(() => {
    // Create a fresh instance for each test
    settingsService = new SettingsService();
    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('getSetting', () => {
    it('should return setting value from database when not cached', async () => {
      const mockSetting = {
        key: 'approvalThresholdUsd',
        value: 10000,
        description: 'Budget threshold',
        updatedAt: new Date(),
        updatedById: null,
      };

      vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(mockSetting);

      const result = await settingsService.getSetting('approvalThresholdUsd');

      expect(result).toBe(10000);
      expect(prisma.systemSetting.findUnique).toHaveBeenCalledWith({
        where: { key: 'approvalThresholdUsd' },
      });
    });

    it('should return setting value from cache when cached', async () => {
      const mockSetting = {
        key: 'approvalThresholdUsd',
        value: 10000,
        description: 'Budget threshold',
        updatedAt: new Date(),
        updatedById: null,
      };

      vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(mockSetting);

      // First call - should hit database
      await settingsService.getSetting('approvalThresholdUsd');
      
      // Second call - should hit cache
      const result = await settingsService.getSetting('approvalThresholdUsd');

      expect(result).toBe(10000);
      // Should only be called once (first time)
      expect(prisma.systemSetting.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should return null when setting does not exist', async () => {
      vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(null);

      const result = await settingsService.getSetting('nonExistentKey');

      expect(result).toBeNull();
    });

    it('should cache different setting values correctly', async () => {
      const mockSettings = [
        { key: 'setting1', value: 'value1', description: '', updatedAt: new Date(), updatedById: null },
        { key: 'setting2', value: 'value2', description: '', updatedAt: new Date(), updatedById: null },
      ];

      vi.mocked(prisma.systemSetting.findUnique)
        .mockResolvedValueOnce(mockSettings[0])
        .mockResolvedValueOnce(mockSettings[1]);

      const result1 = await settingsService.getSetting('setting1');
      const result2 = await settingsService.getSetting('setting2');

      expect(result1).toBe('value1');
      expect(result2).toBe('value2');
    });
  });

  describe('setSetting', () => {
    it('should create new setting when it does not exist', async () => {
      const userId = 'user-123';
      const key = 'newSetting';
      const value = 'newValue';
      const description = 'New setting description';

      vi.mocked(prisma.systemSetting.upsert).mockResolvedValue({
        key,
        value,
        description,
        updatedAt: new Date(),
        updatedById: userId,
      });

      await settingsService.setSetting(key, value, userId, description);

      expect(prisma.systemSetting.upsert).toHaveBeenCalledWith({
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
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should update existing setting', async () => {
      const userId = 'user-123';
      const key = 'existingSetting';
      const value = 'updatedValue';

      vi.mocked(prisma.systemSetting.upsert).mockResolvedValue({
        key,
        value,
        description: null,
        updatedAt: new Date(),
        updatedById: userId,
      });

      await settingsService.setSetting(key, value, userId);

      expect(prisma.systemSetting.upsert).toHaveBeenCalled();
    });

    it('should invalidate cache after setting value', async () => {
      const userId = 'user-123';
      const key = 'cachedSetting';
      const initialValue = 'initial';
      const updatedValue = 'updated';

      // First, cache a value
      vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
        key,
        value: initialValue,
        description: null,
        updatedAt: new Date(),
        updatedById: null,
      });

      await settingsService.getSetting(key);

      // Now update it
      vi.mocked(prisma.systemSetting.upsert).mockResolvedValue({
        key,
        value: updatedValue,
        description: null,
        updatedAt: new Date(),
        updatedById: userId,
      });

      await settingsService.setSetting(key, updatedValue, userId);

      // Get it again - should hit database because cache was cleared
      vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
        key,
        value: updatedValue,
        description: null,
        updatedAt: new Date(),
        updatedById: userId,
      });

      const result = await settingsService.getSetting(key);

      expect(result).toBe(updatedValue);
      // Should be called twice (once before update, once after)
      expect(prisma.systemSetting.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should handle different value types', async () => {
      const userId = 'user-123';

      // Number
      await settingsService.setSetting('numberSetting', 42, userId);
      expect(prisma.systemSetting.upsert).toHaveBeenLastCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ value: 42 }),
        })
      );

      // Boolean
      await settingsService.setSetting('boolSetting', true, userId);
      expect(prisma.systemSetting.upsert).toHaveBeenLastCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ value: true }),
        })
      );

      // Object
      await settingsService.setSetting('objectSetting', { foo: 'bar' }, userId);
      expect(prisma.systemSetting.upsert).toHaveBeenLastCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ value: { foo: 'bar' } }),
        })
      );
    });
  });

  describe('getAllSettings', () => {
    it('should return all settings ordered by key', async () => {
      const mockSettings = [
        {
          key: 'approvalThresholdUsd',
          value: 10000,
          description: 'Budget threshold',
          updatedAt: new Date(),
          updatedById: 'user-1',
          updatedBy: { fullName: 'Admin User' },
        },
        {
          key: 'emailNotificationsEnabled',
          value: true,
          description: 'Enable emails',
          updatedAt: new Date(),
          updatedById: 'user-1',
          updatedBy: { fullName: 'Admin User' },
        },
      ];

      vi.mocked(prisma.systemSetting.findMany).mockResolvedValue(mockSettings);

      const result = await settingsService.getAllSettings();

      expect(result).toEqual(mockSettings);
      expect(prisma.systemSetting.findMany).toHaveBeenCalledWith({
        orderBy: { key: 'asc' },
        include: {
          updatedBy: {
            select: {
              fullName: true,
            },
          },
        },
      });
    });

    it('should return empty array when no settings exist', async () => {
      vi.mocked(prisma.systemSetting.findMany).mockResolvedValue([]);

      const result = await settingsService.getAllSettings();

      expect(result).toEqual([]);
    });
  });

  describe('deleteSetting', () => {
    it('should delete setting from database', async () => {
      const key = 'settingToDelete';

      vi.mocked(prisma.systemSetting.delete).mockResolvedValue({
        key,
        value: 'value',
        description: null,
        updatedAt: new Date(),
        updatedById: null,
      });

      await settingsService.deleteSetting(key);

      expect(prisma.systemSetting.delete).toHaveBeenCalledWith({
        where: { key },
      });
    });

    it('should invalidate cache after deletion', async () => {
      const key = 'cachedSettingToDelete';

      // First, cache a value
      vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
        key,
        value: 'value',
        description: null,
        updatedAt: new Date(),
        updatedById: null,
      });

      await settingsService.getSetting(key);

      // Delete it
      vi.mocked(prisma.systemSetting.delete).mockResolvedValue({
        key,
        value: 'value',
        description: null,
        updatedAt: new Date(),
        updatedById: null,
      });

      await settingsService.deleteSetting(key);

      // Try to get it again - should hit database
      vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(null);

      const result = await settingsService.getSetting(key);

      expect(result).toBeNull();
      expect(prisma.systemSetting.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached settings', async () => {
      // Cache multiple settings
      vi.mocked(prisma.systemSetting.findUnique)
        .mockResolvedValueOnce({ key: 'setting1', value: 'value1', description: null, updatedAt: new Date(), updatedById: null })
        .mockResolvedValueOnce({ key: 'setting2', value: 'value2', description: null, updatedAt: new Date(), updatedById: null });

      await settingsService.getSetting('setting1');
      await settingsService.getSetting('setting2');

      // Clear cache
      settingsService.clearCache();

      // Get settings again - should hit database
      vi.mocked(prisma.systemSetting.findUnique)
        .mockResolvedValueOnce({ key: 'setting1', value: 'value1', description: null, updatedAt: new Date(), updatedById: null })
        .mockResolvedValueOnce({ key: 'setting2', value: 'value2', description: null, updatedAt: new Date(), updatedById: null });

      await settingsService.getSetting('setting1');
      await settingsService.getSetting('setting2');

      // Should be called 4 times total (2 before clear, 2 after)
      expect(prisma.systemSetting.findUnique).toHaveBeenCalledTimes(4);
    });
  });

  describe('seedDefaultSettings', () => {
    it('should create default settings that do not exist', async () => {
      // Mock findUnique to return null (setting doesn't exist)
      vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(null);

      // Mock create
      vi.mocked(prisma.systemSetting.create).mockResolvedValue({
        key: 'approvalThresholdUsd',
        value: 10000,
        description: 'Budget threshold requiring committee approval (USD)',
        updatedAt: new Date(),
        updatedById: null,
      });

      await settingsService.seedDefaultSettings();

      // Should check for existence of all 10 default settings
      expect(prisma.systemSetting.findUnique).toHaveBeenCalledTimes(10);

      // Should create all 10 settings
      expect(prisma.systemSetting.create).toHaveBeenCalledTimes(10);
    });

    it('should not create settings that already exist', async () => {
      // Mock findUnique to return existing settings
      vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
        key: 'approvalThresholdUsd',
        value: 10000,
        description: 'Budget threshold',
        updatedAt: new Date(),
        updatedById: null,
      });

      await settingsService.seedDefaultSettings();

      // Should check for existence
      expect(prisma.systemSetting.findUnique).toHaveBeenCalledTimes(10);

      // Should not create any settings
      expect(prisma.systemSetting.create).not.toHaveBeenCalled();
    });

    it('should create correct default values', async () => {
      vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.systemSetting.create).mockResolvedValue({
        key: 'test',
        value: 'test',
        description: null,
        updatedAt: new Date(),
        updatedById: null,
      });

      await settingsService.seedDefaultSettings();

      // Verify specific default settings
      expect(prisma.systemSetting.create).toHaveBeenCalledWith({
        data: {
          key: 'approvalThresholdUsd',
          value: 10000,
          description: 'Budget threshold requiring committee approval (USD)',
        },
      });

      expect(prisma.systemSetting.create).toHaveBeenCalledWith({
        data: {
          key: 'emailNotificationsEnabled',
          value: true,
          description: 'Enable email notifications',
        },
      });

      expect(prisma.systemSetting.create).toHaveBeenCalledWith({
        data: {
          key: 'smtpPort',
          value: 587,
          description: 'SMTP server port',
        },
      });
    });
  });
});
