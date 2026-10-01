import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireSession, requireSection } from "@/lib/session";
import { readBusinessProfile } from "@/lib/business-profile";
import { InvoiceDocument } from "@/components/invoice-document";
import { PrintButton } from "@/components/print-button";

export default async function PrintInvoicePage({ params }: PageProps<"/print/invoices/[id]">) {
  const session = await requireSession();
  await requireSection(session, "invoices");
  const { id } = await params;

  const [invoice, business] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id },
      include: { customer: true, order: { include: { items: true } } },
    }),
    readBusinessProfile(),
  ]);

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
