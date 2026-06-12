import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;
const memory = new Map<string, { count: number; reset: number }>();

let ratelimit: Ratelimit | null = null;

type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
};

function getUpstashLimiter() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  ratelimit ??= new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(LIMIT, "10 m"),
    analytics: true,
    prefix: "ai-cv-generator",
  });

  return ratelimit;
}

function localLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const current = memory.get(identifier);

  if (!current || current.reset <= now) {
    const reset = now + WINDOW_MS;
    memory.set(identifier, { count: 1, reset });
    return { success: true, remaining: LIMIT - 1, reset };
  }

  if (current.count >= LIMIT) {
    return { success: false, remaining: 0, reset: current.reset };
  }

  current.count += 1;
  memory.set(identifier, current);

  return {
    success: true,
    remaining: LIMIT - current.count,
    reset: current.reset,
  };
}

export async function checkGenerationRateLimit(
  identifier: string,
): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter();

  if (!limiter) {
    return localLimit(identifier);
  }

  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}
