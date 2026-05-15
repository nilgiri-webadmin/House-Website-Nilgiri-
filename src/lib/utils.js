import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combine classNames with clsx and merge tailwind classes
 * @param {...any} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
