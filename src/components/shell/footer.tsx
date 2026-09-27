import Link from "next/link";

const columns: { heading: string; links: { href: string; label: string }[] }[] =
  [
    {
      heading: "Discover",
      links: [
        { href: "/clubs", label: "Explore clubs" },
        { href: "/events", label: "Events" },
        { href: "/map", label: "Map" },
        { href: "/offers", label: "Offers" },
      ],
    },
    {
      heading: "For clubs",
      links: [
        { href: "/for-clubs", label: "Partner with us" },
        { href: "/partner/apply", label: "Apply" },
        { href: "/partner/login", label: "Partner login" },
      ],
    },
    {
      heading: "Company",
      links: [
        { href: "/about", label: "About" },
        { href: "/contact", label: "Contact" },
        { href: "/help", label: "Help centre" },
      ],
    },
    {
      heading: "Legal",
      links: [
        { href: "/legal/terms", label: "Terms of use" },
        { href: "/legal/privacy", label: "Privacy policy" },
        { href: "/legal/refunds", label: "Refund & cancellation policy" },
        { href: "/legal/cookies", label: "Cookie policy" },
        { href: "/legal/partner-terms", label: "Partner terms" },
        { href: "/legal/grievance", label: "Grievance officer" },
      ],
    },
  ];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-night-raised/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((col) => (
          <div key={col.heading}>
            <h2 className="mb-3 text-sm font-semibold text-moon">
              {col.heading}
            </h2>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-moon-dim hover:text-moon"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-moon-dim">
        © {new Date().getFullYear()} ThirtyML. Drink responsibly — clubs check
        ID at the door.
      </div>
    </footer>
  );
}
