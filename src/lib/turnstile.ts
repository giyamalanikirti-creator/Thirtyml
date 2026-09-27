import "server-only";

/**
 * Cloudflare Turnstile server-side verification. Without a secret key we
 * treat every token as valid so development flows keep working — production
 * MUST have TURNSTILE_SECRET_KEY set.
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  const params = new URLSearchParams({ secret, response: token });
  if (remoteIp) params.set("remoteip", remoteIp);
  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: params }
  );
  if (!res.ok) return false;
  const body = (await res.json()) as { success?: boolean };
  return Boolean(body.success);
}
