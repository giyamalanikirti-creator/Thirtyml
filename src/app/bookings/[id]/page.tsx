import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CancelPanel } from "./cancel-panel";

export const metadata: Metadata = { title: "Your ticket" };
export const dynamic = "force-dynamic";

const nightFmt = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();
  const supabase = await supabaseServer();

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      `id, booking_code, night_date, guest_count, status,
       clubs(name, slug, address, lat, lng, phone, cities(slug)),
       tickets(qr_token, status, guests_total, guests_admitted),
       booking_guests(full_name, is_lead)`
    )
    .eq("id", id)
    .maybeSingle();
  if (!booking) notFound();

  const ticket = booking.tickets?.[0];
  const qrDataUrl =
    ticket && ticket.status !== "void"
      ? await QRCode.toDataURL(ticket.qr_token, {
          width: 480,
          margin: 1,
          color: { dark: "#0d1120", light: "#f2efe6" },
        })
      : null;

  const club = booking.clubs;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
        <Link href="/bookings" className="text-sm text-moon-dim hover:text-moon">
          ← My bookings
        </Link>

        <div className="mt-4 overflow-hidden rounded-lg border border-line bg-night-raised">
          <div className="border-b border-line p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="font-display text-2xl font-bold">{club?.name}</h1>
                <p className="mt-1 text-sm text-moon-dim">
                  {nightFmt.format(new Date(`${booking.night_date}T12:00:00`))}
                </p>
              </div>
              <Badge
                variant={
                  booking.status === "confirmed" || booking.status === "checked_in"
                    ? "drop"
                    : booking.status === "cancelled"
                      ? "danger"
                      : "default"
                }
              >
                {booking.status.replace("_", " ")}
              </Badge>
            </div>
          </div>

          {qrDataUrl ? (
            <div className="bg-moon p-6 text-center text-night">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt={`Entry QR code for booking ${booking.booking_code}`}
                className="mx-auto h-56 w-56"
              />
              <p className="tnum mt-3 font-mono text-lg font-bold tracking-widest">
                {booking.booking_code}
              </p>
              <p className="mt-1 text-xs text-night/60">
                Turn your brightness up at the door. Works offline once this
                page has loaded.
              </p>
              {ticket && ticket.guests_admitted > 0 && (
                <p className="mt-2 text-xs font-medium">
                  {ticket.guests_admitted} of {ticket.guests_total} guests
                  admitted
                </p>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-moon-dim">
              {booking.status === "cancelled"
                ? "This booking was cancelled — the QR is no longer valid."
                : "Ticket unavailable."}
            </div>
          )}

          <div className="space-y-2 p-5 text-sm">
            <p>
              <span className="text-moon-dim">Guests:</span>{" "}
              {booking.guest_count}
              {(booking.booking_guests ?? []).length > 0 && (
                <span className="text-moon-dim">
                  {" "}
                  · lead:{" "}
                  {booking.booking_guests.find((g) => g.is_lead)?.full_name}
                </span>
              )}
            </p>
            {club?.address && (
              <p className="text-moon-dim">{club.address}</p>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              {club?.lat && club?.lng && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${club.lat},${club.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  Get directions
                </a>
              )}
              <a
                href={`/api/bookings/${booking.id}/calendar`}
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                Add to calendar
              </a>
              {club?.phone && (
                <a
                  href={`tel:${club.phone}`}
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  Call the club
                </a>
              )}
            </div>
          </div>
        </div>

        {booking.status === "confirmed" && (
          <CancelPanel bookingId={booking.id} />
        )}
      </main>
      <Footer />
    </>
  );
}
