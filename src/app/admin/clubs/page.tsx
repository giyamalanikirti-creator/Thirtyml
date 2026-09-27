import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { approveClub, suspendClub, featureClub } from "./actions";

export const metadata: Metadata = { title: "Clubs" };
export const dynamic = "force-dynamic";

export default async function AdminClubsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { profile } = await requireAdmin();
  const sp = await searchParams;
  const admin = supabaseAdmin();
  let query = admin.from("clubs").select("id, slug, name, status, is_featured, cities(slug, name)").order("name");
  if (sp.status) query = query.eq("status", sp.status);
  const { data: clubs } = await query;

  return (
    <AdminShell profile={profile} section="/clubs">
      <div className="mb-4 flex gap-2 text-sm" role="radiogroup">
        {[
          { key: "", label: "All" },
          { key: "pending_approval", label: "Pending" },
          { key: "approved", label: "Approved" },
          { key: "suspended", label: "Suspended" },
        ].map((t) => (
          <Link
            key={t.key}
            href={t.key ? `/admin/clubs?status=${t.key}` : "/admin/clubs"}
            className={
              "rounded-full border px-3 py-1 " +
              ((sp.status ?? "") === t.key
                ? "border-sodium bg-sodium/15 text-sodium"
                : "border-line text-moon-dim hover:text-moon")
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-moon-dim">
              <th className="px-4 py-2 font-normal">Club</th>
              <th className="px-4 py-2 font-normal">City</th>
              <th className="px-4 py-2 font-normal">Status</th>
              <th className="px-4 py-2 font-normal">Featured</th>
              <th className="px-4 py-2 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {(clubs ?? []).map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <a href={`/${c.cities?.slug}/clubs/${c.slug}`} className="font-medium hover:text-sodium">
                    {c.name}
                  </a>
                </td>
                <td className="px-4 py-3 text-moon-dim">{c.cities?.name}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      c.status === "approved"
                        ? "drop"
                        : c.status === "suspended"
                          ? "danger"
                          : "default"
                    }
                  >
                    {c.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">{c.is_featured ? "★" : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <ActionButtons clubId={c.id} status={c.status} isFeatured={c.is_featured} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function ActionButtons({
  clubId,
  status,
  isFeatured,
}: {
  clubId: string;
  status: string;
  isFeatured: boolean;
}) {
  return (
    <div className="flex justify-end gap-2">
      {status !== "approved" && (
        <form action={approveClub.bind(null, clubId)}>
          <Button size="sm" variant="secondary" type="submit">
            Approve
          </Button>
        </form>
      )}
      {status !== "suspended" && (
        <form action={suspendClub.bind(null, clubId)}>
          <Button size="sm" variant="ghost" type="submit">
            Suspend
          </Button>
        </form>
      )}
      <form action={featureClub.bind(null, clubId, !isFeatured)}>
        <Button size="sm" variant="ghost" type="submit">
          {isFeatured ? "Unfeature" : "Feature"}
        </Button>
      </form>
    </div>
  );
}
