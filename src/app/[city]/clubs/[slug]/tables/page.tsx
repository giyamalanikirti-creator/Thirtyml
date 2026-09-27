import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import { todayIst } from "@/lib/data/catalog";
import { TablePicker, type TablePickerData } from "./table-picker";

export const metadata: Metadata = { title: "Book a table" };
export const dynamic = "force-dynamic";

type Params = { city: string; slug: string };

export default async function TablesPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { city, slug } = await params;
  const { date } = await searchParams;
  const selectedDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayIst();

  if (!isSupabaseConfigured()) {
    return (
      <>
        <Header city={city} />
        <main className="mx-auto max-w-3xl px-4 py-12">
          <p className="text-sm text-moon-dim">
            Table booking runs against a real Supabase project. In this demo
            environment, browse entry passes from the club page instead.
          </p>
          <Link href={`/${city}/clubs/${slug}`} className="text-dusk hover:underline">
            Back to club
          </Link>
        </main>
      </>
    );
  }

  const supabase = await supabaseServer();
  const { data: club } = await supabase
    .from("clubs")
    .select(
      "id, name, slug, floor_plans(id, width, height, tables(id, name, x, y, shape, capacity, min_spend, zone, product_id, products(base_price, name)))"
    )
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle();
  if (!club || !club.floor_plans?.[0]) notFound();
  const plan = club.floor_plans[0];

  const productIds = (plan.tables ?? []).map((t) => t.product_id);
  const { data: prices } = productIds.length
    ? await supabase.rpc("catalog_prices", {
        p_product_ids: productIds,
        p_date: selectedDate,
      })
    : { data: [] as never[] };
  const priceMap = new Map((prices ?? []).map((p) => [p.product_id, p]));

  const data: TablePickerData = {
    clubName: club.name,
    citySlug: city,
    clubSlug: club.slug,
    date: selectedDate,
    width: plan.width,
    height: plan.height,
    tables: (plan.tables ?? []).map((t) => {
      const live = priceMap.get(t.product_id);
      return {
        id: t.id,
        productId: t.product_id,
        name: t.name,
        x: t.x,
        y: t.y,
        shape: t.shape as "round" | "rect" | "booth",
        capacity: t.capacity,
        minSpend: t.min_spend,
        zone: t.zone,
        price: live?.price ?? t.products?.base_price ?? 0,
        available: (live?.available ?? 1) > 0,
      };
    }),
  };

  return (
    <>
      <Header city={city} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <nav aria-label="Breadcrumb" className="text-xs text-moon-dim">
          <Link href={`/${city}/clubs/${slug}`} className="hover:text-moon">
            {club.name}
          </Link>{" "}
          / Tables
        </nav>
        <h1 className="mt-2 font-display text-2xl font-semibold">
          Pick your table
        </h1>
        <p className="text-sm text-moon-dim">
          {new Intl.DateTimeFormat("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "Asia/Kolkata",
          }).format(new Date(`${selectedDate}T12:00:00`))}
        </p>
        <TablePicker data={data} />
      </main>
      <Footer />
    </>
  );
}
