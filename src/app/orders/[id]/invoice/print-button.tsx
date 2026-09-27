"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="mt-6 rounded border border-neutral-300 px-4 py-2 text-xs print:hidden"
    >
      Print / save as PDF
    </button>
  );
}
