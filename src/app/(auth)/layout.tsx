import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="mb-8 font-display text-2xl font-bold tracking-tight"
      >
        Thirty<span className="text-sodium">ML</span>
      </Link>
      {children}
    </main>
  );
}
