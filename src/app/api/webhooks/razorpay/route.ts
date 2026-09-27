import { NextResponse } from "next/server";
import { getPaymentsProvider } from "@/lib/providers";
import { finalizeOrderPaid, markPaymentFailed } from "@/lib/payments";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface RazorpayWebhook {
  event: string;
  payload?: {
    payment?: {
      entity?: {
        id: string;
        order_id: string;
        method?: string;
        error_description?: string;
      };
    };
    refund?: { entity?: { id: string; payment_id: string; status: string } };
  };
}

/**
 * Razorpay webhook. Signature-verified, idempotent via webhook_events
 * (unique event id), and safe to receive before or after the client
 * callback.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const eventId = request.headers.get("x-razorpay-event-id") ?? "";

  const provider = getPaymentsProvider();
  if (!provider.verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let body: RazorpayWebhook;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  // Idempotency: a replayed event id no-ops.
  const { error: insertError } = await admin.from("webhook_events").insert({
    event_id: eventId || `${body.event}:${rawBody.slice(0, 64)}`,
    type: body.event,
    payload: body as never,
  });
  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  let processingError: string | null = null;
  try {
    switch (body.event) {
      case "payment.captured":
      case "order.paid": {
        const payment = body.payload?.payment?.entity;
        if (payment?.order_id && payment.id) {
          const { data: row } = await admin
            .from("payments")
            .select("order_id")
            .eq("razorpay_order_id", payment.order_id)
            .maybeSingle();
          if (row) {
            await finalizeOrderPaid({
              orderId: row.order_id,
              gatewayOrderId: payment.order_id,
              gatewayPaymentId: payment.id,
              method: payment.method,
              rawPayload: body,
            });
          }
        }
        break;
      }
      case "payment.failed": {
        const payment = body.payload?.payment?.entity;
        if (payment?.order_id) {
          await markPaymentFailed({
            gatewayOrderId: payment.order_id,
            reason: payment.error_description,
            rawPayload: body,
          });
        }
        break;
      }
      case "refund.processed":
      case "refund.failed": {
        const refund = body.payload?.refund?.entity;
        if (refund?.id) {
          await admin
            .from("refunds")
            .update({
              status: body.event === "refund.processed" ? "processed" : "failed",
            })
            .eq("razorpay_refund_id", refund.id);
        }
        break;
      }
      case "transfer.processed": {
        // Payout transfers (Razorpay Route) — handled in the payouts phase.
        break;
      }
      default:
        break;
    }
  } catch (e) {
    processingError = e instanceof Error ? e.message : "processing failed";
  }

  await admin
    .from("webhook_events")
    .update({
      processed_at: new Date().toISOString(),
      error: processingError,
    })
    .eq("event_id", eventId || `${body.event}:${rawBody.slice(0, 64)}`);

  if (processingError) {
    // 500 asks Razorpay to retry; idempotency makes the retry safe.
    return NextResponse.json({ error: processingError }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
