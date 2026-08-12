export const LEADERSHIP_PRIORITY = {
  SECRETARY: 0,
  DEPUTY_SECRETARY: 1,
  WEB_ADMIN: 2,
  OTHER: 999,
} as const;

export function getLeadershipPriority(positionOrRole?: string | null): number {
  const text = (positionOrRole || '').toLowerCase().trim();
  if (!text) return LEADERSHIP_PRIORITY.OTHER;

  if (text.includes('deputy') && text.includes('secretary')) {
    return LEADERSHIP_PRIORITY.DEPUTY_SECRETARY;
  }

  if (text === 'secretary' || (text.includes('secretary') && !text.includes('deputy'))) {
    return LEADERSHIP_PRIORITY.SECRETARY;
  }

  if (/web[-\s]?admin(istrator)?s?/.test(text)) {
    return LEADERSHIP_PRIORITY.WEB_ADMIN;
  }

  return LEADERSHIP_PRIORITY.OTHER;
}

export function sortByLeadershipPriority<T>(
  items: T[],
  getRole: (item: T) => string | undefined | null = (item: any) => item.position || item.role
): T[] {
  return [...items].sort(
    (a, b) => getLeadershipPriority(getRole(a)) - getLeadershipPriority(getRole(b))
  );
}
