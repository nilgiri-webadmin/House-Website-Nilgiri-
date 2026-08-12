export const ROLE_DISPLAY_NAMES = {
  secretary: 'Secretary',
  depsec: 'Deputy Secretary',
  webadmin: 'Web Admin',
  admin: 'Admin',
  club: 'Club Admin',
} as const;

export const ROLE_OPTIONS = [
  ROLE_DISPLAY_NAMES.secretary,
  ROLE_DISPLAY_NAMES.depsec,
  ROLE_DISPLAY_NAMES.webadmin,
  'Other',
] as const;

export type RoleOption = typeof ROLE_OPTIONS[number];

export const ADMIN_ROLES = ['secretary', 'webadmin', 'depsec', 'admin'] as const;
export type AdminRole = typeof ADMIN_ROLES[number];

export const ALL_ROLES = [...ADMIN_ROLES, 'club'] as const;
export type AllRole = typeof ALL_ROLES[number];
