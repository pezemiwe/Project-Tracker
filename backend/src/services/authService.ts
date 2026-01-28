import { prisma } from "../utils/prisma.js";
import { verifyPassword } from "../utils/password.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { LoginResponse } from "../types/index.js";

export class AuthService {
  async login(
    email: string,
    password: string,
    ipAddress?: string,
  ): Promise<LoginResponse> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorRole: user.role,
        action: "Create",
        objectType: "Session",
        objectId: user.id,
        comment: "User logged in",
        ipAddress,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenVersion: 0, // For future token revocation support
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async logout(userId: string, ipAddress?: string): Promise<void> {
    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: "Delete",
        objectType: "Session",
        objectId: userId,
        comment: "User logged out",
        ipAddress,
      },
    });

    // In a full implementation, add refresh token to Redis blacklist
    // For now, tokens will naturally expire
  }
}

export const authService = new AuthService();
