import { randomUUID, createHmac } from "node:crypto";
import type {
  EmailProvider,
  PaymentsProvider,
  SmsProvider,
} from "./types";

/**
 * Console/mock providers used whenever real keys are missing (all of local
 * dev by default). Payments simulate a gateway that always accepts; the mock
 * signature scheme mirrors Razorpay's HMAC layout so verification code paths
 * are exercised for real.
 */

const MOCK_SECRET = "thirtyml-mock-secret";

export function mockPaymentSignature(orderId: string, paymentId: string) {
  return createHmac("sha256", MOCK_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

export const mockPayments: PaymentsProvider = {
  name: "mock",
  async createOrder(input) {
    const gatewayOrderId = `order_mock_${input.idempotencyKey.slice(0, 20)}`;
    console.info(
      `[payments:mock] created order ${gatewayOrderId} for ₹${input.amountPaise / 100} (our order ${input.orderId})`
    );
    return {
      gatewayOrderId,
      amountPaise: input.amountPaise,
      currency: "INR",
      keyId: null,
    };
  },
  verifyPaymentSignature({ gatewayOrderId, gatewayPaymentId, signature }) {
    return signature === mockPaymentSignature(gatewayOrderId, gatewayPaymentId);
  },
  verifyWebhookSignature(rawBody, signature) {
    return (
      signature ===
      createHmac("sha256", MOCK_SECRET).update(rawBody).digest("hex")
    );
  },
  async fetchPaymentStatus() {
    return { status: "captured", amountPaise: 0 };
  },
  async createRefund(input) {
    console.info(
      `[payments:mock] refund ₹${input.amountPaise / 100} for ${input.gatewayPaymentId}`
    );
    return { gatewayRefundId: `rfnd_mock_${randomUUID()}`, status: "processed" };
  },
};

export const mockEmail: EmailProvider = {
  name: "console",
  async send(message) {
    console.info(
      `[email:console] to=${message.to} subject="${message.subject}" (${message.html.length} bytes html)`
    );
    return { id: `email_mock_${randomUUID()}` };
  },
};

export const mockSms: SmsProvider = {
  name: "console",
  async sendOtp(phone, otp) {
    // Deliberately printed so local sign-in works without MSG91.
    console.info(`[sms:console] OTP for ${phone}: ${otp}`);
    return { id: `sms_mock_${randomUUID()}` };
  },
  async sendSms(phone, templateId, vars) {
    console.info(`[sms:console] to=${phone} template=${templateId}`, vars);
    return { id: `sms_mock_${randomUUID()}` };
  },
  async sendWhatsApp(phone, templateId, vars) {
    console.info(`[wa:console] to=${phone} template=${templateId}`, vars);
    return { id: `wa_mock_${randomUUID()}` };
  },
};
