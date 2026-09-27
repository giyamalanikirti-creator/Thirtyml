import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  CreatePaymentOrderInput,
  PaymentOrder,
  PaymentsProvider,
  RefundInput,
  RefundResult,
} from "./types";

/**
 * Razorpay over its REST API (no SDK dependency). Test keys in dev/staging,
 * live keys only in production. Signatures per
 * https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration/
 */

const API = "https://api.razorpay.com/v1";

function authHeader(): string {
  const id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!;
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

function hmacEquals(expected: string, actual: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function rzp<T>(
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {}
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...(init.idempotencyKey
        ? { "X-Razorpay-Idempotency": init.idempotencyKey }
        : {}),
      ...init.headers,
    },
  });
  const body = (await res.json()) as T & {
    error?: { description?: string };
  };
  if (!res.ok) {
    throw new Error(
      body.error?.description ?? `Razorpay ${path} failed (${res.status})`
    );
  }
  return body;
}

export const razorpayPayments: PaymentsProvider = {
  name: "razorpay",

  async createOrder(input: CreatePaymentOrderInput): Promise<PaymentOrder> {
    const order = await rzp<{ id: string; amount: number; currency: string }>(
      "/orders",
      {
        method: "POST",
        idempotencyKey: input.idempotencyKey,
        body: JSON.stringify({
          amount: input.amountPaise,
          currency: input.currency,
          receipt: input.orderId,
          notes: { thirtyml_order_id: input.orderId, ...input.notes },
        }),
      }
    );
    return {
      gatewayOrderId: order.id,
      amountPaise: order.amount,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? null,
    };
  },

  verifyPaymentSignature({ gatewayOrderId, gatewayPaymentId, signature }) {
    const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${gatewayOrderId}|${gatewayPaymentId}`)
      .digest("hex");
    return hmacEquals(expected, signature);
  },

  verifyWebhookSignature(rawBody, signature) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return false;
    const expected = createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    return hmacEquals(expected, signature);
  },

  async fetchPaymentStatus(gatewayPaymentId) {
    const payment = await rzp<{ status: string; amount: number }>(
      `/payments/${gatewayPaymentId}`
    );
    return {
      status: payment.status as
        | "created"
        | "authorized"
        | "captured"
        | "refunded"
        | "failed",
      amountPaise: payment.amount,
    };
  },

  async createRefund(input: RefundInput): Promise<RefundResult> {
    const refund = await rzp<{ id: string; status: string }>(
      `/payments/${input.gatewayPaymentId}/refund`,
      {
        method: "POST",
        idempotencyKey: input.idempotencyKey,
        body: JSON.stringify({
          amount: input.amountPaise,
          speed: "normal",
          notes: input.notes,
        }),
      }
    );
    return {
      gatewayRefundId: refund.id,
      status:
        refund.status === "processed"
          ? "processed"
          : refund.status === "failed"
            ? "failed"
            : "pending",
    };
  },
};
