import { NextResponse } from "next/server";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "./rate-limiter";

/**
 * Rate limit configuration type
 */
type RateLimitConfig = {
  max: number;
  window: number;
};

/**
 * Apply rate limiting to an API route handler
 * @param handler - The API route handler function
 * @param config - Rate limit configuration
 * @returns Wrapped handler with rate limiting
 */
export function withRateLimit<T extends any[] = []>(
  handler: (request: Request, ...args: T) => Promise<Response>,
  config: RateLimitConfig = RATE_LIMITS.API_DEFAULT
) {
  return async (request: Request, ...args: T): Promise<Response> => {
    const identifier = getClientIdentifier(request);

    // Check rate limit (async DB call)
    const isLimited = await checkRateLimit(identifier, config.max, config.window);

    if (isLimited) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": "60", // Generic retry after
          },
        }
      );
    }

    const response = await handler(request, ...args);
    return response;
  };
}

/**
 * Error response helper
 */
export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json(
    { error: message },
    { status }
  );
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Validate required environment variables
 */
export function validateEnvVars(vars: string[]): { valid: boolean; missing: string[] } {
  const missing = vars.filter(varName => !process.env[varName]);
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Parse and validate request body
 */
export async function parseRequestBody<T>(request: Request): Promise<T | null> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    return null;
  }
}

