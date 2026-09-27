import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Distributed rate limits backed by Upstash Redis. In dev without keys
 * every call passes through — the guard is skipped, not simulated.
 *
 *   const rl = getLimiter("otp", { limit: 5, window: "1m" });
 *   const { success } = await rl.limit(`otp:${phone}`);
 */

interface LimiterSpec {
  limit: number;
  /** Upstash window: e.g. "1 m", "10 s". */
  window: `${number} ${"s" | "m" | "h" | "d"}`;
}

const limiters = new Map<string, Ratelimit>();

function redis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export function getLimiter(name: string, spec: LimiterSpec): Ratelimit | null {
  const cached = limiters.get(name);
  if (cached) return cached;
  const client = redis();
  if (!client) return null;
  const rl = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(spec.limit, spec.window),
    prefix: `tml:${name}`,
    analytics: false,
  });
  limiters.set(name, rl);
  return rl;
}

/** Convenience: returns true when the request is allowed. */
export async function allow(name: string, spec: LimiterSpec, key: string): Promise<boolean> {
  const rl = getLimiter(name, spec);
  if (!rl) return true;
  const { success } = await rl.limit(key);
  return success;
}

/** Extract a best-effort client identity from the request. */
export function clientKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
