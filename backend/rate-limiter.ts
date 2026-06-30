import { prisma } from '@/backend/db';

export const RATE_LIMITS = {
  API_DEFAULT: { max: 100, window: 60 }, // 100 requests per minute
  AUTH_STRICT: { max: 5, window: 60 * 15 }, // 5 attempts per 15 minutes
  AI_GEN: { max: 10, window: 60 * 60 }, // 10 generations per hour
  NEWS: { max: 30, window: 60 }, // 30 requests per minute
};

/**
 * Check if a key is rate limited backed by Database
 * @param key Unique key (e.g. "cleanup:127.0.0.1")
 * @param limit Max requests
 * @param windowSeconds Window in seconds
 * @returns true if rate limited, false otherwise
 */
export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const now = new Date();
  // Ensure windowSeconds is a valid number to prevent NaN dates
  const safeWindow = Math.max(1, windowSeconds);

  try {
    // Transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {

      const record = await tx.rateLimit.findUnique({
        where: { key }
      });

      if (record && record.expiresAt > now) {
        // Active window
        if (record.count >= limit) {
          return true; // Limited
        }

        // Increment
        await tx.rateLimit.update({
          where: { key },
          data: { count: record.count + 1 }
        });
        return false;
      } else {
        // New window or expired
        // Upsert to handle race conditions where it might have been created between find and now
        await tx.rateLimit.upsert({
          where: { key },
          create: {
            key,
            count: 1,
            expiresAt: new Date(now.getTime() + safeWindow * 1000)
          },
          update: {
            count: 1,
            expiresAt: new Date(now.getTime() + safeWindow * 1000)
          }
        });
        return false;
      }
    });

    return result;
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open if DB is down
    return false;
  }
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (works with most proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to user agent + accept language (less reliable but better than nothing)
  const userAgent = request.headers.get("user-agent") || "unknown";
  const acceptLanguage = request.headers.get("accept-language") || "unknown";

  return `${userAgent}-${acceptLanguage}`;
}

