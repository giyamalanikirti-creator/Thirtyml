import type { Metadata } from "next";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { ApplyForm } from "./apply-form";

export const metadata: Metadata = { title: "List your club" };

export default function PartnerApplyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
        <h1 className="font-display text-2xl font-semibold">
          List your club on ThirtyML
        </h1>
        <p className="mt-2 text-sm text-moon-dim">
          Tell us about your venue and we&apos;ll get back within 2 working
          days. You keep full control of your prices, always.
        </p>
        <div className="mt-8">
          <ApplyForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
