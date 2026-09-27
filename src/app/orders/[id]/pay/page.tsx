import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/shell/header";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { PayClient } from "./pay-client";

export const metadata: Metadata = { title: "Pay" };
export const dynamic = "force-dynamic";

export default async function PayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();
  const supabase = await supabaseServer();
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, total, hold_expires_at, lead_guest_name, lead_guest_email, lead_guest_phone")
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();
  if (order.status === "paid") redirect(`/orders/${id}`);
  if (order.status !== "pending_payment") redirect(`/orders/${id}/status`);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <PayClient
          orderId={order.id}
          total={order.total}
          holdExpiresAt={order.hold_expires_at}
          guest={{
            name: order.lead_guest_name ?? "",
            email: order.lead_guest_email ?? "",
            phone: order.lead_guest_phone ?? "",
          }}
        />
      </main>
    </>
  );
}
