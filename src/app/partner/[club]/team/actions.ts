"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import { emailSchema } from "@/lib/validation/auth";

async function assertOwner(clubId: string): Promise<string> {
  const session = await requireUser();
  const supabase = await supabaseServer();
  const { data: member } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", clubId)
    .eq("user_id", session.userId)
    .is("removed_at", null)
    .maybeSingle();
  if (!member || member.role !== "owner") throw new Error("Not authorised");
  return session.userId;
}

const inviteSchema = z.object({
  clubId: z.string().uuid(),
  email: emailSchema,
  role: z.enum(["manager", "door_staff", "finance"]),
});

export async function inviteMember(input: unknown) {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const actorId = await assertOwner(parsed.data.clubId);
  const admin = supabaseAdmin();

  // The invitee must already have a profile — we don't auto-provision auth
  // users. Owners share the sign-up link and then get added here.
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", parsed.data.email)
    .maybeSingle();
  if (!profile) {
    return {
      ok: false as const,
      error: "That email doesn't have an account yet. Ask them to sign up on ThirtyML first.",
    };
  }

  const { error } = await admin
    .from("club_members")
    .insert({
      club_id: parsed.data.clubId,
      user_id: profile.id,
      role: parsed.data.role,
      invited_by: actorId,
    });
  if (error) return { ok: false as const, error: error.message };
  await admin.from("profiles").update({ role: "club_staff" }).eq("id", profile.id).eq("role", "customer");
  revalidatePath(`/partner/[club]/team`, "page");
  return { ok: true as const };
}

export async function removeMember(clubId: string, memberId: string) {
  await assertOwner(clubId);
  await supabaseAdmin()
    .from("club_members")
    .update({ removed_at: new Date().toISOString() })
    .eq("id", memberId)
    .eq("club_id", clubId);
  revalidatePath(`/partner/[club]/team`, "page");
  return { ok: true as const };
}
