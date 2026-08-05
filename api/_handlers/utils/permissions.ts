// Centralized permissions configuration
import { requireRole } from './auth';
import type { AuthUser } from './auth';

type Role = AuthUser['role'];

// Define all roles that have administrative access
export const ADMIN_ROLES: Role[] = ['secretary', 'webadmin', 'depsec', 'admin'];
export type AdminRole = typeof ADMIN_ROLES[number];

// Define roles that include club access
export const ALL_ROLES: Role[] = ['secretary', 'webadmin', 'depsec', 'admin', 'club'];
export type AllRole = typeof ALL_ROLES[number];

/**
 * Middleware factory that requires the user to have an admin role
 * @returns Middleware function that checks for admin access
 */
export function requireAdmin() {
  return requireRole(ADMIN_ROLES);
}

/**
 * Middleware factory that requires the user to have any valid role (including club)
 */
export function requireAnyRole() {
  return requireRole(ALL_ROLES);
}