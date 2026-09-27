import Link from "next/link";
import { Search, Heart, ShoppingCart, User } from "lucide-react";
import { CitySwitcher } from "./city-switcher";

export function Header({ city }: { city?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-night/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link
          href="/"
          className="font-display text-lg font-bold tracking-tight text-moon"
        >
          Thirty<span className="text-sodium">ML</span>
        </Link>

        <CitySwitcher current={city} className="hidden sm:inline-flex" />

        <Link
          href="/search"
          className="ml-auto flex h-9 flex-1 max-w-sm items-center gap-2 rounded-sm border border-line bg-night-raised px-3 text-sm text-moon-dim hover:border-moon-dim sm:flex-initial sm:w-64"
        >
          <Search className="h-4 w-4" aria-hidden />
          <span className="truncate">Search clubs, events…</span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Account">
          <Link
            href="/favorites"
            className="rounded-sm p-2 text-moon-dim hover:text-moon"
            aria-label="Favourites"
          >
            <Heart className="h-5 w-5" />
          </Link>
          <Link
            href="/cart"
            className="rounded-sm p-2 text-moon-dim hover:text-moon"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
          </Link>
          <Link
            href="/account"
            className="rounded-sm p-2 text-moon-dim hover:text-moon"
            aria-label="Account"
          >
            <User className="h-5 w-5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
