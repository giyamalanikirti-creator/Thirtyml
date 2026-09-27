import type { Metadata } from "next";
import { requirePartnerClub } from "@/lib/partner/current";
import { supabaseAdmin } from "@/lib/supabase/server";
import { PartnerShell } from "@/components/partner/shell";
import { FloorPlanEditor, type TableRow } from "./floor-plan-editor";

export const metadata: Metadata = { title: "Floor plan" };
export const dynamic = "force-dynamic";

export default async function FloorPlanPage({
  params,
}: {
  params: Promise<{ club: string }>;
}) {
  const { club } = await params;
  const ctx = await requirePartnerClub(club, ["owner", "manager"]);
  const admin = supabaseAdmin();
  const { data: floorPlan } = await admin
    .from("floor_plans")
    .select("id, width, height")
    .eq("club_id", ctx.club.id)
    .maybeSingle();
  const { data: tables } = floorPlan
    ? await admin
        .from("tables")
        .select("id, name, x, y, shape, capacity, min_spend, zone, products(base_price)")
        .eq("floor_plan_id", floorPlan.id)
    : { data: [] as never[] };

  const rows: TableRow[] = (tables ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    x: t.x,
    y: t.y,
    shape: t.shape as TableRow["shape"],
    capacity: t.capacity,
    minSpend: t.min_spend,
    zone: t.zone,
    productPrice: t.products?.base_price ?? 0,
  }));

  return (
    <PartnerShell ctx={ctx} section="/floor-plan">
      <p className="mb-4 text-sm text-moon-dim">
        Drop tables where they sit on your floor. Drag to move. Customers pick
        from this exact layout.
      </p>
      <FloorPlanEditor
        clubId={ctx.club.id}
        floorPlanId={floorPlan?.id ?? null}
        tables={rows}
        width={floorPlan?.width ?? 1000}
        height={floorPlan?.height ?? 700}
      />
    </PartnerShell>
  );
}
