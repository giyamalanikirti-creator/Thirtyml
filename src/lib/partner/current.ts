import "server-only";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type Membership = Database["public"]["Tables"]["club_members"]["Row"];
export type Club = Database["public"]["Tables"]["clubs"]["Row"];

export interface PartnerContext {
  userId: string;
  membership: Membership;
  club: Club;
  /** Every club the signed-in user belongs to — powers the club switcher. */
  memberships: (Membership & { club: Pick<Club, "id" | "slug" | "name"> })[];
}

/**
 * Look up the signed-in user's current club by slug, redirecting if they
 * don't belong to it. The dashboard nests routes under /partner/[club] so
 * a partner staffing multiple clubs can flip between them without losing
 * context.
 */
export async function requirePartnerClub(
  clubSlug: string,
  roles: Membership["role"][] = []
): Promise<PartnerContext> {
  const session = await requireUser();
  const supabase = await supabaseServer();

  const { data: memberships } = await supabase
    .from("club_members")
    .select(
      "id, club_id, user_id, role, invited_by, removed_at, created_at, club:clubs(id, slug, name)"
    )
    .eq("user_id", session.userId)
    .is("removed_at", null);

  const list = memberships ?? [];
  const active = list.find((m) => m.club?.slug === clubSlug);
  if (!active || !active.club) redirect("/partner");
  if (roles.length > 0 && !roles.includes(active.role)) redirect(`/partner/${clubSlug}`);

  const { data: club } = await supabase
    .from("clubs")
    .select("*")
    .eq("id", active.club_id)
    .single();
  if (!club) redirect("/partner");

  return {
    userId: session.userId,
    membership: {
      id: active.id,
      club_id: active.club_id,
      user_id: active.user_id,
      role: active.role,
      invited_by: active.invited_by,
      removed_at: active.removed_at,
      created_at: active.created_at,
    },
    club,
    memberships: list.filter((m) => m.club) as PartnerContext["memberships"],
  };
}

export async function listMyMemberships() {
  const session = await requireUser();
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("club_members")
    .select(
      "id, role, club:clubs(id, slug, name, status)"
    )
    .eq("user_id", session.userId)
    .is("removed_at", null);
  return data ?? [];
}
