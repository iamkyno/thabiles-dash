import type { Metadata } from "next";

// Client-facing invoice links: keep them out of search engines, and don't leak the link
// to other sites through the Referer header.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function SharedInvoiceLayout({ children }: LayoutProps<"/invoice">) {
  return (
    <div className="min-h-dvh bg-white text-black">
      <div className="mx-auto max-w-2xl p-4 sm:p-8 print:p-0">{children}</div>
    </div>
  );
}
