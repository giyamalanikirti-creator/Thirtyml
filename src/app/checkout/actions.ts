"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getCartView } from "@/lib/cart";
import { createOrderFromCart, previewTotals } from "@/lib/orders";
import { emailSchema, phoneSchema } from "@/lib/validation/auth";
import type { Totals } from "@/lib/pricing";

export async function checkCoupon(
  code: string,
  useWallet: boolean
): Promise<{ totals: Totals; couponError?: string }> {
  const session = await requireUser();
  const view = await getCartView();
  return previewTotals(view, code || null, useWallet, session.userId);
}

const guestSchema = z.object({
  name: z.string().trim().min(2, "Enter the lead guest's name").max(80),
  phone: phoneSchema,
  email: emailSchema,
  couponCode: z.string().trim().max(40).optional(),
  useWallet: z.boolean().optional(),
  agreed: z.literal(true, {
    message: "Please accept the terms and refund policy",
  }),
});

export async function submitCheckout(input: unknown): Promise<
  { ok: true; orderId: string } | { ok: false; error: string }
> {
  const session = await requireUser();
  const parsed = guestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const result = await createOrderFromCart({
    userId: session.userId,
    guest: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
    },
    couponCode: parsed.data.couponCode || null,
    useWallet: Boolean(parsed.data.useWallet),
  });
  if (!result.ok) return result;
  return { ok: true, orderId: result.orderId };
}
