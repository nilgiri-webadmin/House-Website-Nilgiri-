export const LEADERSHIP_PRIORITY = {
  SECRETARY: 0,
  DEPUTY_SECRETARY: 1,
  WEB_ADMIN: 2,
  OTHER: 999,
};

/**
 * Returns sort priority for Secretary, Deputy Secretary, and Web Admin roles.
 * Lower number = higher priority. All other roles return OTHER (999).
 */
export function getLeadershipPriority(positionOrRole) {
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

/**
 * Sorts a list so Secretary, Deputy Secretary, and Web Admin always appear first
 * in that order. All other members keep their relative order.
 */
export function sortByLeadershipPriority(items, getRole = (item) => item.position || item.role) {
  return [...items].sort((a, b) => {
    const priorityDiff = getLeadershipPriority(getRole(a)) - getLeadershipPriority(getRole(b));
    return priorityDiff;
  });
}

/**
 * Comparator for use inside multi-criteria sorts (leadership first, then custom).
 */
export function compareLeadershipPriority(a, b, getRole = (item) => item.position || item.role) {
  return getLeadershipPriority(getRole(a)) - getLeadershipPriority(getRole(b));
}
