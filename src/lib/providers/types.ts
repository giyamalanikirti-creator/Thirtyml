/**
 * Every third-party service sits behind one of these interfaces. When the
 * relevant keys are missing, a console/mock implementation is used so the
 * whole app runs locally with zero third-party accounts.
 */

// ---------------------------------------------------------------- payments

export interface CreatePaymentOrderInput {
  /** Our orders.id (UUID) */
  orderId: string;
  /** Amount in integer paise */
  amountPaise: number;
  currency: "INR";
  /** Passed to the gateway as notes/metadata */
  notes?: Record<string, string>;
  /** Idempotency key: same key must not create a second gateway order */
  idempotencyKey: string;
}

export interface PaymentOrder {
  gatewayOrderId: string;
  amountPaise: number;
  currency: "INR";
  /** Client-side key id needed to open the checkout widget (public) */
  keyId: string | null;
}

export interface RefundInput {
  gatewayPaymentId: string;
  amountPaise: number;
  notes?: Record<string, string>;
  idempotencyKey: string;
}

export interface RefundResult {
  gatewayRefundId: string;
  status: "pending" | "processed" | "failed";
}

export interface PaymentsProvider {
  readonly name: string;
  createOrder(input: CreatePaymentOrderInput): Promise<PaymentOrder>;
  /** Verify the checkout callback signature (order_id|payment_id HMAC) */
  verifyPaymentSignature(params: {
    gatewayOrderId: string;
    gatewayPaymentId: string;
    signature: string;
  }): boolean;
  /** Verify a webhook body signature */
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  fetchPaymentStatus(gatewayPaymentId: string): Promise<{
    status: "created" | "authorized" | "captured" | "refunded" | "failed";
    amountPaise: number;
  }>;
  createRefund(input: RefundInput): Promise<RefundResult>;
}

// ------------------------------------------------------------------ email

export interface EmailMessage {
  to: string;
  subject: string;
  /** Rendered HTML body */
  html: string;
  text?: string;
  attachments?: { filename: string; content: Buffer | string }[];
}

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<{ id: string }>;
}

// ------------------------------------------------------------- sms / whatsapp

export interface SmsProvider {
  readonly name: string;
  sendOtp(phone: string, otp: string): Promise<{ id: string }>;
  sendSms(phone: string, templateId: string, vars: Record<string, string>): Promise<{ id: string }>;
  sendWhatsApp(
    phone: string,
    templateId: string,
    vars: Record<string, string>
  ): Promise<{ id: string }>;
}
