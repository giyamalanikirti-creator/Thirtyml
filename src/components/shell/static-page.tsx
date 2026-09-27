import { Header } from "./header";
import { Footer } from "./footer";

export function StaticPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {title}
        </h1>
        <div className="prose-invert mt-6 space-y-4 text-sm leading-relaxed text-moon-dim [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-moon [&_strong]:text-moon">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
