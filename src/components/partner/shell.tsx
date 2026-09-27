import Link from "next/link";
import type { PartnerContext } from "@/lib/partner/current";
import {
  Home,
  Tag,
  Sofa,
  CalendarClock,
  Users,
  QrCode,
  BarChart3,
  BadgeIndianRupee,
  Percent,
  Settings,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: PartnerContext["membership"]["role"][];
}

const NAV: NavItem[] = [
  { href: "", label: "Overview", icon: Home },
  { href: "/pricing", label: "Pricing", icon: Tag, roles: ["owner", "manager"] },
  { href: "/floor-plan", label: "Tables", icon: Sofa, roles: ["owner", "manager"] },
  { href: "/events", label: "Events", icon: CalendarClock, roles: ["owner", "manager"] },
  { href: "/bookings", label: "Bookings", icon: Users },
  { href: "/check-in", label: "Check-in", icon: QrCode },
  { href: "/analytics", label: "Analytics", icon: BarChart3, roles: ["owner", "manager", "finance"] },
  { href: "/promo-codes", label: "Promos", icon: Percent, roles: ["owner", "manager"] },
  { href: "/payouts", label: "Payouts", icon: BadgeIndianRupee, roles: ["owner", "finance"] },
  { href: "/team", label: "Team", icon: Users, roles: ["owner"] },
  { href: "/profile", label: "Profile", icon: Building2, roles: ["owner", "manager"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["owner", "manager"] },
];

export function PartnerShell({
  ctx,
  section,
  children,
  actions,
}: {
  ctx: PartnerContext;
  section: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const base = `/partner/${ctx.club.slug}`;
  return (
    <div className="flex min-h-screen bg-night text-moon">
      <aside className="hidden w-56 shrink-0 border-r border-line bg-aubergine/30 lg:block">
        <div className="border-b border-line px-4 py-4">
          <Link href="/partner" className="font-display text-lg font-bold">
            Thirty<span className="text-sodium">ML</span>
          </Link>
          <p className="text-[10px] uppercase tracking-widest text-dusk">
            Partner
          </p>
        </div>
        <div className="border-b border-line px-4 py-3">
          {ctx.memberships.length > 1 ? (
            <details>
              <summary className="cursor-pointer font-display text-sm font-semibold">
                {ctx.club.name}
                <span className="ml-1 text-xs text-moon-dim">▾</span>
              </summary>
              <ul className="mt-2 space-y-1 text-sm">
                {ctx.memberships.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/partner/${m.club?.slug}`}
                      className={cn(
                        "block rounded-sm px-2 py-1 hover:bg-night-raised",
                        m.club?.id === ctx.club.id && "text-sodium"
                      )}
                    >
                      {m.club?.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ) : (
            <p className="font-display text-sm font-semibold">{ctx.club.name}</p>
          )}
          <p className="mt-1 text-[10px] uppercase tracking-widest text-moon-dim">
            {ctx.membership.role.replace("_", " ")}
          </p>
        </div>
        <nav className="p-2">
          {NAV.filter(
            (item) =>
              !item.roles || item.roles.includes(ctx.membership.role)
          ).map((item) => {
            const active = section === item.href;
            return (
              <Link
                key={item.href}
                href={`${base}${item.href}`}
                className={cn(
                  "flex items-center gap-2 rounded-sm px-3 py-2 text-sm",
                  active
                    ? "bg-sodium/15 text-sodium"
                    : "text-moon-dim hover:bg-night-raised hover:text-moon"
                )}
              >
                <item.icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-14 items-center justify-between gap-3 border-b border-line px-4">
          <h1 className="font-display text-lg font-semibold">
            {NAV.find((n) => n.href === section)?.label ?? "Partner"}
          </h1>
          <div className="flex items-center gap-3">
            {actions}
            <Link
              href="/"
              className="text-sm text-moon-dim hover:text-moon"
            >
              View site
            </Link>
          </div>
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
