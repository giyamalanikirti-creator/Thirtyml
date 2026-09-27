import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { Button } from "@/components/ui/button";
import { PrefsForm } from "./prefs-form";
import { markAllRead } from "./actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

const timeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

export default async function NotificationsPage() {
  const { userId } = await requireUser();
  const supabase = await supabaseServer();

  const [{ data: notifications }, { data: prefsRow }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, title, body, read_at, created_at, category")
      .eq("channel", "in_app")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("notification_preferences")
      .select("prefs")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const rows = notifications ?? [];

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold">Notifications</h1>
          {rows.some((n) => !n.read_at) && (
            <form action={markAllRead}>
              <Button variant="ghost" size="sm" type="submit">
                Mark all read
              </Button>
            </form>
          )}
        </div>

        {rows.length === 0 ? (
          <p className="mt-8 rounded-md border border-line bg-night-raised p-6 text-sm text-moon-dim">
            Nothing yet. Booking confirmations and alerts land here.
          </p>
        ) : (
          <ul className="mt-6 space-y-2">
            {rows.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "rounded-md border border-line px-4 py-3",
                  n.read_at ? "bg-night" : "bg-night-raised"
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className={cn("text-sm", !n.read_at && "font-medium")}>
                    {n.title}
                  </p>
                  <span className="shrink-0 text-xs text-moon-dim">
                    {timeFmt.format(new Date(n.created_at))}
                  </span>
                </div>
                {n.body && (
                  <p className="mt-1 whitespace-pre-line text-sm text-moon-dim">
                    {n.body}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10">
          <PrefsForm
            initial={
              (prefsRow?.prefs as Record<string, Record<string, boolean>>) ?? {}
            }
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
