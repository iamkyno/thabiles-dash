import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { prisma } from "@/lib/prisma";
import { readBusinessProfile } from "@/lib/business-profile";
import { invoiceNumber } from "@/lib/invoices";
import { InvoiceDocument } from "@/components/invoice-document";
import { PrintButton } from "@/components/print-button";

// Public, no login: whoever has the link can view this one invoice. Turning sharing off
// clears the token, so old links stop working.
const getSharedInvoice = cache(async (token: string) => {
  if (!/^[A-Za-z0-9_-]{32}$/.test(token)) return null;
  return prisma.invoice.findUnique({
    where: { shareToken: token },
    include: { customer: true, order: { include: { items: true } } },
  });
});

export async function generateMetadata({ params }: PageProps<"/invoice/[token]">): Promise<Metadata> {
  await connection();
  const { token } = await params;
  const [invoice, business] = await Promise.all([getSharedInvoice(token), readBusinessProfile()]);
  if (!invoice) return { title: "Invoice not available" };
  return {
    title: `Invoice ${invoiceNumber(business.invoicePrefix, invoice.invoiceSeq)} from ${business.businessName}`,
    description: "View, print or save your invoice as a PDF.",
  };
}

export default async function SharedInvoicePage({ params }: PageProps<"/invoice/[token]">) {
  // Always read fresh, so payments and a turned-off link show straight away.
  await connection();
  const { token } = await params;
  const [invoice, business] = await Promise.all([getSharedInvoice(token), readBusinessProfile()]);
  if (!invoice) notFound();

  return (
    <div className="space-y-8">
      <div className="no-print flex justify-end">
        <PrintButton />
      </div>
      <InvoiceDocument invoice={invoice} business={business} />
    </div>
  );
}
