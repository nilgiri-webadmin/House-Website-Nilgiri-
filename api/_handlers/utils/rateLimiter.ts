import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RateLimitOptions {
  windowMs: number; // duration of window in milliseconds
  maxRequests: number; // max requests per window per IP
}

/**
 * Simple in-memory rate limiter.
 * Note: For serverless environments, this resets on each instance cold start.
 * For production across multiple instances, consider using Redis or similar.
 */
export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests } = options;
  // Map IP => { timestamp of first request in current window, count }
  const cache = new Map<string, { startTime: number; count: number }>();

  return async (req: VercelRequest, res: VercelResponse, next: () => Promise<any> | any) => {
    const ip = (req.headers['x-forwarded-for'] as string) ||
               (req.headers['x-real-ip'] as string) ||
               (req.socket?.remoteAddress as string) ||
               'unknown';
    // Normalize IPv6 localhost
    const normalizedIp = ip === '::1' || ip === 'localhost' ? '127.0.0.1' : ip;

    const now = Date.now();
    const record = cache.get(normalizedIp);
    if (!record) {
      // First request from this IP
      cache.set(normalizedIp, { startTime: now, count: 1 });
      // Cleanup old entries (simple)
      for (const [key, val] of cache.entries()) {
        if (now - val.startTime > windowMs) {
          cache.delete(key);
        }
      }
      return next();
    }

    // Check if window has expired
    if (now - record.startTime > windowMs) {
      // Reset window
      record.startTime = now;
      record.count = 1;
      return next();
    }

    // Increment count
    if (++record.count > maxRequests) {
      const secondsToReset = Math.ceil((windowMs - (now - record.startTime)) / 1000);
      return res.status(429).json({
        error: `Too many requests, please try again after ${secondsToReset} seconds`,
      });
    }

    return next();
  };
}