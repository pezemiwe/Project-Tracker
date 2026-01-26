import { UserRole } from '../stores/authStore';

export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

export function isAdmin(userRole: UserRole): boolean {
  return userRole === 'Admin';
}

export function isPM(userRole: UserRole): boolean {
  return hasRole(userRole, ['Admin', 'ProjectManager']);
}

export function isFinance(userRole: UserRole): boolean {
  return hasRole(userRole, ['Admin', 'Finance']);
}

export function isCommittee(userRole: UserRole): boolean {
  return hasRole(userRole, ['Admin', 'CommitteeMember']);
}

export function isAuditor(userRole: UserRole): boolean {
  return hasRole(userRole, ['Admin', 'Auditor']);
}

export function canManageUsers(userRole: UserRole): boolean {
  return isAdmin(userRole);
}

export function canCreateObjectives(userRole: UserRole): boolean {
  return isPM(userRole);
}

export function canApproveFinance(userRole: UserRole): boolean {
  return isFinance(userRole);
}

export function canApproveCommittee(userRole: UserRole): boolean {
  return isCommittee(userRole);
}
