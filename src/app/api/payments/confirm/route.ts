import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserAndProfile } from "@/lib/auth";
import { getPaymentsProvider } from "@/lib/providers";
import { finalizeOrderPaid } from "@/lib/payments";
import { supabaseAdmin } from "@/lib/supabase/server";

const schema = z.object({
  orderId: z.string().uuid(),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

/**
 * Client success callback. The signature is verified server-side and the
 * amounts come from our own tables — nothing from the client is trusted
 * beyond the gateway identifiers.
 */
export async function POST(request: Request) {
  const session = await getUserAndProfile();
  if (!session) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    parsed.data;

  const admin = supabaseAdmin();
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id")
    .eq("id", orderId)
    .single();
  if (!order || order.user_id !== session.userId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  const { data: payment } = await admin
    .from("payments")
    .select("razorpay_order_id")
    .eq("order_id", orderId)
    .eq("razorpay_order_id", razorpay_order_id)
    .maybeSingle();
  if (!payment) {
    return NextResponse.json({ error: "Unknown payment" }, { status: 404 });
  }

  const provider = getPaymentsProvider();
  const valid = provider.verifyPaymentSignature({
    gatewayOrderId: razorpay_order_id,
    gatewayPaymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const result = await finalizeOrderPaid({
    orderId,
    gatewayOrderId: razorpay_order_id,
    gatewayPaymentId: razorpay_payment_id,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
