import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@prisma/client';
import { verifyAccessToken } from '../utils/jwt.js';
import { JWTPayload } from '../types/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    request.user = payload;
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
}

export function requireRoles(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({ error: 'Insufficient permissions' });
    }
  };
}

export function requireRole(role: UserRole) {
  return requireRoles(role);
}

// Convenience middleware for common role checks
export const requireAdmin = requireRole('Admin');
export const requirePM = requireRoles('Admin', 'ProjectManager');
export const requireFinance = requireRoles('Admin', 'Finance');
export const requireCommittee = requireRoles('Admin', 'CommitteeMember');
export const requireAuditor = requireRoles('Admin', 'Auditor');
