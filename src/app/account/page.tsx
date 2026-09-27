import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/account/profile-form";
import { DangerZone } from "@/components/account/danger-zone";
import { DEFAULT_CITY } from "@/lib/cities";

export const metadata: Metadata = { title: "Profile & settings" };

export default async function AccountPage() {
  const { profile } = await requireUser();

  const supabase = await supabaseServer();
  const { data: homeCity } = profile.home_city_id
    ? await supabase
        .from("cities")
        .select("slug")
        .eq("id", profile.home_city_id)
        .maybeSingle()
    : { data: null };

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="font-display text-2xl font-semibold">
          Profile &amp; settings
        </h1>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Personal details</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              initial={{
                fullName: profile.full_name ?? "",
                dateOfBirth: profile.date_of_birth ?? "",
                gender: profile.gender ?? "",
                homeCity: homeCity?.slug ?? DEFAULT_CITY,
              }}
            />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Verified contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p>{profile.email ?? "No email on file"}</p>
                <p className="text-xs text-moon-dim">Email</p>
              </div>
              {profile.email_verified_at ? (
                <Badge variant="drop">Verified</Badge>
              ) : (
                <Badge>Unverified</Badge>
              )}
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p>{profile.phone ?? "No phone on file"}</p>
                <p className="text-xs text-moon-dim">Phone</p>
              </div>
              {profile.phone_verified_at ? (
                <Badge variant="drop">Verified</Badge>
              ) : (
                <Badge>Unverified</Badge>
              )}
            </div>
            <p className="text-xs text-moon-dim">
              Both email and phone must be verified before your first payment.
              Changing either requires re-verification.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Privacy &amp; account</CardTitle>
          </CardHeader>
          <CardContent>
            <DangerZone />
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
}
