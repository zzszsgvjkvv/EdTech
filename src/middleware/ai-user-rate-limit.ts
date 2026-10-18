import type { NextFunction, Request, Response } from 'express';

interface Entry {
  windowStartedAt: number;
  count: number;
}

/**
 * Small single-process limiter for local development and a single Node process.
 * Use Redis or a gateway-level limiter for horizontally scaled production.
 */
export function aiUserRateLimit(options: { windowMs: number; max: number; message: string }) {
  const entries = new Map<string, Entry>();
  let lastCleanupAt = 0;

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const identity = req.authUser?.userId ?? req.ip ?? 'unknown';

    // Opportunistically remove expired keys; no interval/timer is needed.
    if (now - lastCleanupAt > options.windowMs) {
      for (const [key, entry] of entries) {
        if (now - entry.windowStartedAt >= options.windowMs) entries.delete(key);
      }
      lastCleanupAt = now;
    }

    let entry = entries.get(identity);
    if (!entry || now - entry.windowStartedAt >= options.windowMs) {
      entry = { windowStartedAt: now, count: 0 };
      entries.set(identity, entry);
    }

    entry.count += 1;
    const remaining = Math.max(0, options.max - entry.count);
    res.setHeader('X-RateLimit-Limit', String(options.max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));

    if (entry.count > options.max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((entry.windowStartedAt + options.windowMs - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(429).json({ success: false, message: options.message, retryAfterSeconds });
      return;
    }

    next();
  };
}
