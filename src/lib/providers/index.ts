import "server-only";

import type { EmailProvider, PaymentsProvider, SmsProvider } from "./types";
import { mockEmail, mockPayments, mockSms } from "./mock";
import { razorpayPayments } from "./razorpay";
import { resendEmail } from "./resend";

/**
 * Provider factories. Real implementations (Razorpay, Resend, MSG91) are
 * added in their build phases and selected here when keys are present;
 * without keys the app falls back to console/mock providers so everything
 * runs locally.
 */

export function getPaymentsProvider(): PaymentsProvider {
  const mode = process.env.PAYMENTS_MODE ?? "test";
  if (mode === "disabled") return mockPayments;
  if (process.env.RAZORPAY_KEY_SECRET && process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
    return razorpayPayments;
  }
  return mockPayments;
}

export function getEmailProvider(): EmailProvider {
  if (process.env.RESEND_API_KEY) {
    return resendEmail;
  }
  return mockEmail;
}

export function getSmsProvider(): SmsProvider {
  if (process.env.MSG91_AUTH_KEY) {
    // TODO(phase 3): return the real MSG91 provider.
    return mockSms;
  }
  return mockSms;
}

export type { EmailProvider, PaymentsProvider, SmsProvider };
