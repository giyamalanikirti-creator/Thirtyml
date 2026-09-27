"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";
import { signupDetailsSchema } from "@/lib/validation/auth";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateProfile(input: unknown): Promise<ActionResult> {
  const session = await requireUser();
  const parsed = signupDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await supabaseServer();
  const { data: city } = await supabase
    .from("cities")
    .select("id")
    .eq("slug", parsed.data.homeCity)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      date_of_birth: parsed.data.dateOfBirth,
      gender: parsed.data.gender ?? null,
      home_city_id: city?.id ?? null,
    })
    .eq("id", session.userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/account");
  return { ok: true };
}

export async function signOutEverywhere(): Promise<never> {
  await requireUser();
  const supabase = await supabaseServer();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/");
}

export async function signOut(): Promise<never> {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/");
}

/** DPDP: export everything we hold about the signed-in user as JSON. */
export async function exportMyData(): Promise<
  { ok: true; data: Record<string, unknown> } | { ok: false; error: string }
> {
  const session = await requireUser();
  const supabase = await supabaseServer();

  // All reads run under RLS as the user, so this can only ever return the
  // user's own rows.
  const [profile, orders, bookings, reviews, favorites, wallet, notifications] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", session.userId).single(),
      supabase.from("orders").select("*, order_items(*)"),
      supabase.from("bookings").select("*, booking_guests(*), tickets(*)"),
      supabase.from("reviews").select("*"),
      supabase.from("favorites").select("*"),
      supabase.from("wallet_ledger").select("*"),
      supabase.from("notifications").select("*"),
    ]);

  return {
    ok: true,
    data: {
      exported_at: new Date().toISOString(),
      profile: profile.data,
      orders: orders.data,
      bookings: bookings.data,
      reviews: reviews.data,
      favorites: favorites.data,
      wallet_ledger: wallet.data,
      notifications: notifications.data,
    },
  };
}

const deleteConfirmSchema = z.object({ confirm: z.literal("DELETE") });

/**
 * DPDP: soft-delete the account. Personal data is anonymised; orders,
 * payments and invoices are retained as required by law. Auth login is
 * disabled by banning the user.
 */
export async function deleteMyAccount(input: unknown): Promise<ActionResult> {
  const session = await requireUser();
  const parsed = deleteConfirmSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Type DELETE to confirm" };
  }

  let admin;
  try {
    admin = supabaseAdmin();
  } catch {
    return {
      ok: false,
      error: "Account deletion is not available in this environment",
    };
  }

  const { error } = await admin
    .from("profiles")
    .update({
      full_name: "Deleted user",
      phone: null,
      email: null,
      date_of_birth: null,
      gender: null,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", session.userId);
  if (error) return { ok: false, error: error.message };

  await admin.from("audit_logs").insert({
    actor_id: session.userId,
    action: "account.self_delete",
    entity_type: "profile",
    entity_id: session.userId,
    reason: "user requested deletion",
  });

  // Ban far in the future = login disabled, financial records intact.
  await admin.auth.admin.updateUserById(session.userId, {
    ban_duration: "87600h",
  });

  const supabase = await supabaseServer();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/");
}
