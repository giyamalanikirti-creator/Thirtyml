import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getUserAndProfile } from "@/lib/auth";
import { ensureGatewayOrder } from "@/lib/payments";
import { mockPaymentSignature } from "@/lib/providers/mock";
import { allow, clientKey } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

const schema = z.object({ orderId: z.string().uuid(), turnstileToken: z.string().optional() });

export async function POST(request: Request) {
  const session = await getUserAndProfile();
  if (!session) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const ip = clientKey(request);
  if (!(await allow("checkout-create", { limit: 8, window: "1 m" }, `${session.userId}:${ip}`))) {
    return NextResponse.json({ error: "Too many attempts, slow down" }, { status: 429 });
  }
  if (process.env.TURNSTILE_SECRET_KEY) {
    const ok = await verifyTurnstile(parsed.data.turnstileToken, ip);
    if (!ok) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }
  }
  const result = await ensureGatewayOrder(parsed.data.orderId, session.userId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  // With the mock provider (no Razorpay keys — dev/staging only), hand the
  // client a simulated payment id + signature so the confirm path is
  // exercised end to end.
  let mock: { paymentId: string; signature: string } | undefined;
  if (result.info.providerName === "mock") {
    const paymentId = `pay_mock_${randomUUID().slice(0, 12)}`;
    mock = {
      paymentId,
      signature: mockPaymentSignature(result.info.gatewayOrderId, paymentId),
    };
  }

  return NextResponse.json({
    gatewayOrderId: result.info.gatewayOrderId,
    keyId: result.info.keyId,
    amount: result.info.amountPaise,
    provider: result.info.providerName,
    holdExpiresAt: result.holdExpiresAt,
    mock,
  });
}
