import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/shell/header";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { StatusClient } from "./status-client";

export const metadata: Metadata = { title: "Payment status" };
export const dynamic = "force-dynamic";

export default async function StatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();
  const supabase = await supabaseServer();
  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-4 py-16">
        <StatusClient orderId={order.id} initialStatus={order.status} />
      </main>
    </>
  );
}
