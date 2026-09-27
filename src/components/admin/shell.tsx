import Link from "next/link";
import type { Profile } from "@/lib/auth";
import {
  LayoutDashboard,
  Building2,
  ShoppingBag,
  BadgeIndianRupee,
  Percent,
  Users,
  Settings,
  ClipboardList,
  FileClock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  supportOk?: boolean;
}

const NAV: NavItem[] = [
  { href: "", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clubs", label: "Clubs", icon: Building2 },
  { href: "/applications", label: "Applications", icon: ClipboardList },
  { href: "/orders", label: "Orders", icon: ShoppingBag, supportOk: true },
  { href: "/refunds", label: "Refunds", icon: BadgeIndianRupee, supportOk: true },
  { href: "/coupons", label: "Coupons", icon: Percent },
  { href: "/users", label: "Users", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/audit", label: "Audit log", icon: FileClock },
];

export function AdminShell({
  profile,
  section,
  children,
}: {
  profile: Profile;
  section: string;
  children: React.ReactNode;
}) {
  const canAll = profile.role === "super_admin";
  return (
    <div className="flex min-h-screen bg-night text-moon">
      <aside className="hidden w-52 shrink-0 border-r border-line bg-aubergine/30 lg:block">
        <div className="border-b border-line px-4 py-4">
          <Link href="/" className="font-display text-lg font-bold">
            Thirty<span className="text-sodium">ML</span>
          </Link>
          <p className="text-[10px] uppercase tracking-widest text-rise">
            Admin
          </p>
        </div>
        <nav className="p-2">
          {NAV.filter((item) => canAll || item.supportOk).map((item) => {
            const active = section === item.href;
            return (
              <Link
                key={item.href}
                href={`/admin${item.href}`}
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
        <header className="flex h-14 items-center border-b border-line px-4">
          <h1 className="font-display text-lg font-semibold">
            {NAV.find((n) => n.href === section)?.label ?? "Admin"}
          </h1>
          <p className="ml-auto text-xs text-moon-dim">
            signed in as{" "}
            <span className="text-moon">{profile.full_name ?? profile.email}</span>
            {" · "}
            {profile.role}
          </p>
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
