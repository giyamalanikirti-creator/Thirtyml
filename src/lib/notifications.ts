import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import { getEmailProvider, getSmsProvider } from "@/lib/providers";
import { formatPaise } from "@/lib/utils";

/**
 * Notification outbox. Rows are queued in the same flow as the event that
 * caused them and delivered by the processor (cron-driven), so sending never
 * blocks a request. Transactional categories can't be opted out of.
 */

export async function queueOrderConfirmationNotifications(
  orderId: string
): Promise<void> {
  const admin = supabaseAdmin();
  const { data: order } = await admin
    .from("orders")
    .select(
      `id, user_id, total, lead_guest_email, lead_guest_phone, lead_guest_name,
       bookings(id, booking_code, night_date, clubs(name))`
    )
    .eq("id", orderId)
    .single();
  if (!order) return;

  const bookingLines = (order.bookings ?? [])
    .map(
      (b) =>
        `${b.clubs?.name ?? "Club"} · ${b.night_date} · code ${b.booking_code}`
    )
    .join("\n");

  const rows = [];
  if (order.lead_guest_email) {
    rows.push({
      user_id: order.user_id,
      category: "booking_confirmed",
      channel: "email" as const,
      payload: { order_id: order.id },
      title: "Your ThirtyML booking is confirmed",
      body: `Hi ${order.lead_guest_name ?? "there"},\n\nYou're in! Total paid: ${formatPaise(order.total)}.\n\n${bookingLines}\n\nYour QR tickets and invoice are in your account: /bookings`,
    });
  }
  if (order.lead_guest_phone) {
    rows.push({
      user_id: order.user_id,
      category: "booking_confirmed",
      channel: "whatsapp" as const,
      payload: { order_id: order.id },
      title: "Booking confirmed",
      body: `ThirtyML: booking confirmed. ${bookingLines}. Show the QR in your account at the door.`,
    });
  }
  rows.push({
    user_id: order.user_id,
    category: "booking_confirmed",
    channel: "in_app" as const,
    payload: { order_id: order.id },
    title: "Booking confirmed",
    body: `Paid ${formatPaise(order.total)} — your QR tickets are ready.`,
  });

  await admin.from("notifications").insert(rows);
}

export async function queueNotification(row: {
  userId: string;
  category: string;
  channel: "email" | "sms" | "whatsapp" | "in_app";
  title: string;
  body: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const admin = supabaseAdmin();
  await admin.from("notifications").insert({
    user_id: row.userId,
    category: row.category,
    channel: row.channel,
    title: row.title,
    body: row.body,
    payload: (row.payload as never) ?? {},
  });
}

/** Deliver up to `limit` due notifications. Called by the cron route. */
export async function processNotificationOutbox(limit = 50): Promise<{
  sent: number;
  failed: number;
}> {
  const admin = supabaseAdmin();
  const { data: due } = await admin
    .from("notifications")
    .select("id, user_id, channel, category, title, body")
    .is("sent_at", null)
    .is("failed_at", null)
    .lte("send_after", new Date().toISOString())
    .lt("attempts", 5)
    .order("created_at")
    .limit(limit);

  let sent = 0;
  let failed = 0;
  const email = getEmailProvider();
  const sms = getSmsProvider();

  for (const n of due ?? []) {
    try {
      if (n.channel === "in_app") {
        // Nothing to deliver — the bell reads the table directly.
      } else {
        const { data: profile } = n.user_id
          ? await admin
              .from("profiles")
              .select("email, phone")
              .eq("id", n.user_id)
              .single()
          : { data: null };
        if (n.channel === "email") {
          if (!profile?.email) throw new Error("no email on profile");
          await email.send({
            to: profile.email,
            subject: n.title ?? "ThirtyML",
            html: `<p>${(n.body ?? "").replaceAll("\n", "<br/>")}</p>`,
            text: n.body ?? "",
          });
        } else if (n.channel === "whatsapp" || n.channel === "sms") {
          if (!profile?.phone) throw new Error("no phone on profile");
          if (n.channel === "whatsapp") {
            await sms.sendWhatsApp(profile.phone, n.category, {
              body: n.body ?? "",
            });
          } else {
            await sms.sendSms(profile.phone, n.category, {
              body: n.body ?? "",
            });
          }
        }
      }
      await admin
        .from("notifications")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", n.id);
      sent += 1;
    } catch (e) {
      const message = e instanceof Error ? e.message : "send failed";
      const { data: current } = await admin
        .from("notifications")
        .select("attempts")
        .eq("id", n.id)
        .single();
      const attempts = (current?.attempts ?? 0) + 1;
      await admin
        .from("notifications")
        .update({
          attempts,
          error: message,
          ...(attempts >= 5 ? { failed_at: new Date().toISOString() } : {}),
        })
        .eq("id", n.id);
      failed += 1;
    }
  }
  return { sent, failed };
}
