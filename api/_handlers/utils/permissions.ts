// Centralized permissions configuration
import { requireRole } from './auth';

// Define all roles that have administrative access
export const ADMIN_ROLES = ['secretary', 'webadmin', 'depsec', 'admin'] as const;
export type AdminRole = typeof ADMIN_ROLES[number];

/**
 * Middleware factory that requires the user to have an admin role
 * @returns Middleware function that checks for admin access
 */
export function requireAdmin() {
  return requireRole(ADMIN_ROLES);
}