import "server-only";

import { redirect } from "next/navigation";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ClubMember = Database["public"]["Tables"]["club_members"]["Row"];

/**
 * Server-side guards. Middleware only routes traffic; every server action
 * and route handler re-checks with these — never rely on middleware alone.
 */

export async function getUserAndProfile(): Promise<{
  userId: string;
  profile: Profile;
} | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile || profile.deleted_at) return null;
  return { userId: user.id, profile };
}

export async function requireUser() {
  const session = await getUserAndProfile();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(roles: Profile["role"][]) {
  const session = await requireUser();
  if (!roles.includes(session.profile.role)) redirect("/");
  return session;
}

export async function requireAdmin() {
  return requireRole(["super_admin"]);
}

export async function requireSupport() {
  return requireRole(["super_admin", "support_agent"]);
}

/** Clubs the signed-in user belongs to (for the partner club switcher). */
export async function getMemberships(): Promise<ClubMember[]> {
  const session = await getUserAndProfile();
  if (!session) return [];
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("club_members")
    .select("*")
    .eq("user_id", session.userId)
    .is("removed_at", null);
  return data ?? [];
}

export async function requireClubRole(
  clubId: string,
  roles: ClubMember["role"][] = []
) {
  const session = await requireUser();
  const supabase = await supabaseServer();
  const { data: membership } = await supabase
    .from("club_members")
    .select("*")
    .eq("user_id", session.userId)
    .eq("club_id", clubId)
    .is("removed_at", null)
    .maybeSingle();
  if (!membership || (roles.length > 0 && !roles.includes(membership.role))) {
    redirect("/partner");
  }
  return { ...session, membership };
}
