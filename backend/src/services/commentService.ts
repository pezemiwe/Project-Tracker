import { UserRole } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { notificationService } from './notificationService.js';

interface CreateCommentData {
  activityId: string;
  content: string;
  parentId?: string;
}

interface UpdateCommentData {
  content: string;
}

export class CommentService {
  async createComment(
    data: CreateCommentData,
    userId: string,
    userRole: UserRole,
    ipAddress?: string
  ) {
    // Verify activity exists
    const activity = await prisma.activity.findUnique({
      where: { id: data.activityId, deletedAt: null },
      select: { title: true, createdById: true },
    });

    if (!activity) {
      throw new Error('Activity not found');
    }

    // If parentId is provided, verify it exists and belongs to the same activity
    if (data.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: data.parentId, deletedAt: null },
      });

      if (!parentComment || parentComment.activityId !== data.activityId) {
        throw new Error('Parent comment not found');
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        activityId: data.activityId,
        userId,
        content: data.content,
        parentId: data.parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        actorRole: userRole,
        action: 'Create',
        objectType: 'Comment',
        objectId: comment.id,
        newValues: {
          activityId: data.activityId,
          content: data.content,
        },
        ipAddress,
      },
    });

    // Notify relevant users
    await this.notifyNewComment(comment, activity.title, activity.createdById!);
    await this.handleMentions(comment, activity.title);

    return comment;
  }

  private async handleMentions(comment: any, activityTitle: string) {
    try {
      const content = comment.content;
      const mentionedUserIds = new Set<string>();
      
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, fullName: true }
      });
      
      for (const user of users) {
        const regex = new RegExp(`@${user.fullName}\\b`, 'gi');
        if (regex.test(content)) {
          if (user.id !== comment.userId) {
            mentionedUserIds.add(user.id);
          }
        }
      }

      for (const userId of mentionedUserIds) {
        await notificationService.createNotification({
          userId,
          type: 'UserMentioned',
          title: 'You were mentioned',
          message: `${comment.user.fullName} mentioned you in a comment on "${activityTitle}"`,
          link: `/activities?activityId=${comment.activityId}`,
        });
      }
    } catch (error) {
      console.error('Failed to handle mentions:', error);
    }
  }

  private async notifyNewComment(comment: any, activityTitle: string, activityCreatorId: string) {
    try {
      const usersToNotify = new Set<string>();

      // Notify activity creator if they are not the commenter
      if (activityCreatorId !== comment.userId) {
        usersToNotify.add(activityCreatorId);
      }

      // If it's a reply, notify the parent comment's author
      if (comment.parentId) {
        const parentComment = await prisma.comment.findUnique({
          where: { id: comment.parentId },
          select: { userId: true },
        });
        if (parentComment && parentComment.userId !== comment.userId) {
          usersToNotify.add(parentComment.userId);
        }
      }

      for (const userId of usersToNotify) {
        await notificationService.createNotification({
          userId,
          type: 'CommentAdded',
          title: 'New Comment on Activity',
          message: `${comment.user.fullName} commented on "${activityTitle}"`,
          link: `/activities?activityId=${comment.activityId}`,
        });
      }
    } catch (error) {
      console.error('Failed to send comment notifications:', error);
    }
  }

  async getCommentsByActivityId(activityId: string) {
    return prisma.comment.findMany({
      where: {
        activityId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateComment(
    commentId: string,
    data: UpdateCommentData,
    userId: string,
    userRole: UserRole,
    ipAddress?: string
  ) {
    const currentComment = await prisma.comment.findUnique({
      where: { id: commentId, deletedAt: null },
    });

    if (!currentComment) {
      throw new Error('Comment not found');
    }

    // Only author or admin can update
    if (currentComment.userId !== userId && userRole !== 'Admin') {
      throw new Error('Unauthorized to update this comment');
    }

    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: data.content,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        actorRole: userRole,
        action: 'Update',
        objectType: 'Comment',
        objectId: commentId,
        previousValues: { content: currentComment.content },
        newValues: { content: data.content },
        ipAddress,
      },
    });

    return comment;
  }

  async deleteComment(
    commentId: string,
    userId: string,
    userRole: UserRole,
    ipAddress?: string
  ) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId, deletedAt: null },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Only author or admin can delete
    if (comment.userId !== userId && userRole !== 'Admin') {
      throw new Error('Unauthorized to delete this comment');
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: {
        deletedAt: new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        actorRole: userRole,
        action: 'Delete',
        objectType: 'Comment',
        objectId: commentId,
        ipAddress,
      },
    });
  }
}

export const commentService = new CommentService();
