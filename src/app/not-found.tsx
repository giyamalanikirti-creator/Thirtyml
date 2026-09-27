import Link from "next/link";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="font-display text-6xl font-bold text-sodium">404</p>
        <h1 className="mt-4 font-display text-2xl font-semibold">
          This page has left the club
        </h1>
        <p className="mt-2 max-w-sm text-sm text-moon-dim">
          The link may be old, or the club or event may no longer be listed.
        </p>
        <Link href="/" className={buttonVariants({ variant: "secondary" }) + " mt-8"}>
          Back to tonight&apos;s board
        </Link>
      </main>
      <Footer />
    </>
  );
}
