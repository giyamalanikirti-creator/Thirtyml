import type { Metadata } from "next";
import { requirePartnerClub } from "@/lib/partner/current";
import { supabaseAdmin } from "@/lib/supabase/server";
import { PartnerShell } from "@/components/partner/shell";
import { TeamClient } from "./team-client";

export const metadata: Metadata = { title: "Team" };
export const dynamic = "force-dynamic";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ club: string }>;
}) {
  const { club } = await params;
  const ctx = await requirePartnerClub(club, ["owner"]);
  const admin = supabaseAdmin();
  const { data: members } = await admin
    .from("club_members")
    .select("id, role, created_at, user_id")
    .eq("club_id", ctx.club.id)
    .is("removed_at", null);

  const userIds = (members ?? []).map((m) => m.user_id);
  const { data: profiles } = userIds.length
    ? await admin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds)
    : { data: [] as never[] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <PartnerShell ctx={ctx} section="/team">
      <TeamClient
        clubId={ctx.club.id}
        members={(members ?? []).map((m) => {
          const profile = profileMap.get(m.user_id);
          return {
            id: m.id,
            role: m.role,
            name: profile?.full_name ?? "—",
            email: profile?.email ?? "—",
            isSelf: false,
          };
        })}
      />
    </PartnerShell>
  );
}
