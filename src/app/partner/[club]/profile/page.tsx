import type { Metadata } from "next";
import { requirePartnerClub } from "@/lib/partner/current";
import { PartnerShell } from "@/components/partner/shell";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Club profile" };
export const dynamic = "force-dynamic";

export default async function ClubProfilePage({
  params,
}: {
  params: Promise<{ club: string }>;
}) {
  const { club } = await params;
  const ctx = await requirePartnerClub(club, ["owner", "manager"]);

  return (
    <PartnerShell ctx={ctx} section="/profile">
      <ProfileForm
        clubId={ctx.club.id}
        initial={{
          description: ctx.club.description ?? "",
          address: ctx.club.address ?? "",
          websiteUrl: ctx.club.website_url ?? "",
          instagramUrl: ctx.club.instagram_url ?? "",
          phone: ctx.club.phone ?? "",
          dressCode: ctx.club.dress_code ?? "",
          minAge: ctx.club.min_age,
          lat: ctx.club.lat,
          lng: ctx.club.lng,
          houseRules: ctx.club.house_rules ?? "",
          requiresGuestNames: ctx.club.requires_guest_names,
          bookingCutoffMinutes: ctx.club.booking_cutoff_minutes,
        }}
      />
    </PartnerShell>
  );
}
