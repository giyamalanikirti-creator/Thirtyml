import Link from "next/link";
import { Search, Heart, ShoppingCart, User } from "lucide-react";
import { CitySwitcher } from "./city-switcher";
import { HeaderAuth } from "./header-auth";
import { Suspense } from "react";

export function Header({ city }: { city?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-night/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link
          href="/"
          className="font-display text-xl font-bold tracking-tight text-moon"
        >
          Thirty<span className="text-plum-bright">ML</span>
        </Link>

        <CitySwitcher current={city} className="hidden sm:inline-flex" />

        <Link
          href="/search"
          className="ml-auto hidden h-10 flex-1 max-w-md items-center gap-2 rounded-lg border border-line bg-night-raised px-4 text-sm text-moon-dim transition hover:border-plum/60 hover:text-moon sm:flex"
        >
          <Search className="h-4 w-4" aria-hidden />
          <span className="truncate">Search clubs, events, areas…</span>
          <kbd className="ml-auto hidden rounded border border-line px-1.5 py-0.5 text-[10px] text-moon-faint md:inline">
            /
          </kbd>
        </Link>

        <Link
          href="/search"
          className="ml-auto rounded-md p-2 text-moon-dim hover:text-moon sm:hidden"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Link>

        <nav className="flex items-center gap-1" aria-label="Account">
          <Link
            href="/favorites"
            className="hidden rounded-md p-2 text-moon-dim hover:bg-night-raised hover:text-moon sm:inline-flex"
            aria-label="Favourites"
          >
            <Heart className="h-5 w-5" />
          </Link>
          <Link
            href="/cart"
            className="rounded-md p-2 text-moon-dim hover:bg-night-raised hover:text-moon"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
          </Link>
          <Suspense fallback={<AccountFallback />}>
            <HeaderAuth />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}

function AccountFallback() {
  return (
    <Link
      href="/account"
      className="rounded-md p-2 text-moon-dim hover:bg-night-raised hover:text-moon"
      aria-label="Account"
    >
      <User className="h-5 w-5" />
    </Link>
  );
}
