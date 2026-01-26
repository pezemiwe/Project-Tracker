import { prisma } from '../utils/prisma.js';
import { emailService } from './emailService.js';

interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}

export class NotificationService {
  /**
   * Create notification
   */
  async createNotification(data: CreateNotificationData) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        isRead: false,
        isEmailSent: false,
      },
    });

    // Check user preferences and send email
    try {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        include: { notificationPreferences: true },
      });

      if (user?.email && user.notificationPreferences) {
        let shouldSendEmail = false;
        const prefs = user.notificationPreferences;

        switch (data.type) {
          case 'ApprovalSubmitted':
            shouldSendEmail = prefs.emailApprovalSubmitted;
            break;
          case 'ApprovalDecision':
            shouldSendEmail = prefs.emailApprovalDecision;
            break;
          case 'VarianceAlert':
            shouldSendEmail = prefs.emailVarianceAlert;
            break;
          case 'ImportComplete':
            shouldSendEmail = prefs.emailImportComplete;
            break;
          case 'CommentAdded':
          case 'UserMentioned':
            // These don't have explicit prefs in schema yet, default to true if other emails enabled
            shouldSendEmail = true;
            break;
        }

        if (shouldSendEmail) {
          await emailService.sendEmail({
            to: user.email,
            subject: data.title,
            html: `
              <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #1a365d;">${data.title}</h2>
                <p>${data.message}</p>
                ${data.link ? `<a href="${process.env.FRONTEND_URL}${data.link}" style="display: inline-block; padding: 10px 20px; background-color: #1a365d; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">View in Platform</a>` : ''}
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #666;">This is an automated notification from Donor Oversight Platform.</p>
              </div>
            `,
          });

          await prisma.notification.update({
            where: { id: notification.id },
            data: { isEmailSent: true },
          });
        }
      }
    } catch (error) {
      console.error('Failed to send notification email:', error);
    }

    return notification;
  }

  /**
   * Get notifications for user
   */
  async getUserNotifications(userId: string, limit = 50) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return await prisma.notification.delete({
      where: { id: notificationId },
    });
  }
}

export const notificationService = new NotificationService();
