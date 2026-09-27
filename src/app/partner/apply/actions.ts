"use server";

import { z } from "zod";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import { emailSchema, phoneSchema } from "@/lib/validation/auth";

const applySchema = z.object({
  clubName: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(60),
  contactName: z.string().trim().min(2).max(80),
  contactPhone: phoneSchema,
  contactEmail: emailSchema,
  message: z.string().trim().max(2000).optional(),
});

export async function submitApplication(
  input: unknown
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = applySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Applications aren't open in this environment" };
  }

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("partner_applications").insert({
    applicant_id: user?.id ?? null,
    club_name: parsed.data.clubName,
    city: parsed.data.city,
    contact_name: parsed.data.contactName,
    contact_phone: parsed.data.contactPhone,
    contact_email: parsed.data.contactEmail,
    message: parsed.data.message ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
