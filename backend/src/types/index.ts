import { UserRole } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest {
  user: JWTPayload;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
  };
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface CreateUserRequest {
  email: string;
  fullName: string;
  role: UserRole;
  temporaryPassword: string;
}

export interface UpdateUserRequest {
  email?: string;
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface ResetPasswordRequest {
  newPassword: string;
}
