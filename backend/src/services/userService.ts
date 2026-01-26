import { UserRole } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { hashPassword, validatePasswordStrength } from '../utils/password.js';
import { CreateUserRequest, UpdateUserRequest } from '../types/index.js';

export class UserService {
  async createUser(
    data: CreateUserRequest,
    createdById: string,
    createdByRole: UserRole,
    ipAddress?: string
  ) {
    // Validate password strength
    const passwordValidation = validatePasswordStrength(data.temporaryPassword);
    if (!passwordValidation.valid) {
      throw new Error(`Weak password: ${passwordValidation.errors.join(', ')}`);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(data.temporaryPassword);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        passwordHash,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: createdById,
        actorRole: createdByRole,
        action: 'Create',
        objectType: 'User',
        objectId: user.id,
        newValues: {
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        ipAddress,
      },
    });

    return user;
  }

  async updateUser(
    userId: string,
    data: UpdateUserRequest,
    updatedById: string,
    updatedByRole: UserRole,
    ipAddress?: string
  ) {
    // Get current user state
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new Error('User not found');
    }

    // If email is being changed, check uniqueness
    if (data.email && data.email !== currentUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedById,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Create audit log
    const previousValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};

    if (data.email && data.email !== currentUser.email) {
      previousValues.email = currentUser.email;
      newValues.email = data.email;
    }
    if (data.fullName && data.fullName !== currentUser.fullName) {
      previousValues.fullName = currentUser.fullName;
      newValues.fullName = data.fullName;
    }
    if (data.role && data.role !== currentUser.role) {
      previousValues.role = currentUser.role;
      newValues.role = data.role;
    }
    if (data.isActive !== undefined && data.isActive !== currentUser.isActive) {
      previousValues.isActive = currentUser.isActive;
      newValues.isActive = data.isActive;
    }

    await prisma.auditLog.create({
      data: {
        actorId: updatedById,
        actorRole: updatedByRole,
        action: 'Update',
        objectType: 'User',
        objectId: user.id,
        previousValues,
        newValues,
        ipAddress,
      },
    });

    return user;
  }

  async resetPassword(
    userId: string,
    newPassword: string,
    resetById: string,
    resetByRole: UserRole,
    ipAddress?: string
  ) {
    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(`Weak password: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash password
    const passwordHash = await hashPassword(newPassword);

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        updatedById: resetById,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: resetById,
        actorRole: resetByRole,
        action: 'Update',
        objectType: 'User',
        objectId: userId,
        comment: 'Password reset by admin',
        ipAddress,
      },
    });
  }

  async getUsers(filters: {
    role?: UserRole;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { role, isActive, page = 1, limit = 20 } = filters;

    const where: any = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}

export const userService = new UserService();
