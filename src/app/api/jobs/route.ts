import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { reconcilePendingOrders } from "@/lib/payments";
import { processNotificationOutbox } from "@/lib/notifications";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Cron entry point (Vercel Cron or external scheduler):
 *   POST /api/jobs?task=reconcile      — every 15 minutes
 *   POST /api/jobs?task=notifications  — every minute
 *   POST /api/jobs?task=expire-holds   — every minute (backup for pg_cron)
 * Guarded by the CRON_SECRET bearer token.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const authorized =
    Boolean(secret) &&
    header.length === expected.length &&
    timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const task = new URL(request.url).searchParams.get("task");
  switch (task) {
    case "reconcile": {
      const result = await reconcilePendingOrders();
      return NextResponse.json(result);
    }
    case "notifications": {
      const result = await processNotificationOutbox();
      return NextResponse.json(result);
    }
    case "expire-holds": {
      const admin = supabaseAdmin();
      const { data, error } = await admin.rpc("expire_stale_holds");
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ expired: data });
    }
    default:
      return NextResponse.json({ error: "Unknown task" }, { status: 400 });
  }
}
