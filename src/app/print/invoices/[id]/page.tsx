import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { getBusinessProfile } from "@/actions/business";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/tz";
import { PrintButton } from "@/components/print-button";

export default async function PrintInvoicePage({ params }: PageProps<"/print/invoices/[id]">) {
  await requireSession();
  const { id } = await params;

  const [invoice, business] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id },
      include: { customer: true, order: { include: { items: true } } },
    }),
    getBusinessProfile(),
  ]);

  if (!invoice) notFound();

  const balance = Number(invoice.total) - Number(invoice.amountPaid);

  return (
    <div className="space-y-8">
      <div className="no-print flex justify-end">
        <PrintButton />
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{business.businessName}</h1>
          {business.address && <p className="text-sm text-gray-600">{business.address}</p>}
          {business.taxNumber && <p className="text-sm text-gray-600">Tax no: {business.taxNumber}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-xl font-semibold">Invoice</h2>
          <p className="text-sm text-gray-600">INV-{invoice.invoiceSeq}</p>
          <p className="text-sm text-gray-600">
            Issued {invoice.issuedAt ? formatDate(invoice.issuedAt) : "—"}
          </p>
          <p className="text-sm text-gray-600">Due {invoice.dueAt ? formatDate(invoice.dueAt) : "—"}</p>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-500">Billed to</p>
        <p className="font-medium">{invoice.customer.name}</p>
        {invoice.customer.contactName && <p className="text-sm text-gray-600">{invoice.customer.contactName}</p>}
        {invoice.customer.phone && <p className="text-sm text-gray-600">{invoice.customer.phone}</p>}
        {invoice.customer.email && <p className="text-sm text-gray-600">{invoice.customer.email}</p>}
        {invoice.customer.address && <p className="text-sm text-gray-600">{invoice.customer.address}</p>}
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-300 text-left">
            <th className="py-2">Item</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.order.items.map((item) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="py-2">{item.description}</td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">{formatMoney(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Subtotal</span>
          <span>{formatMoney(invoice.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Tax</span>
          <span>{formatMoney(invoice.taxTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Discount</span>
          <span>-{formatMoney(invoice.discountTotal)}</span>
        </div>
        <div className="flex justify-between border-t border-gray-300 pt-1 font-semibold">
          <span>Total</span>
          <span>{formatMoney(invoice.total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Paid</span>
          <span>{formatMoney(invoice.amountPaid)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Balance due</span>
          <span>{formatMoney(balance)}</span>
        </div>
      </div>

      {invoice.notes && (
        <div>
          <p className="text-sm font-medium text-gray-500">Notes</p>
          <p className="text-sm">{invoice.notes}</p>
        </div>
      )}

      <p className="text-center text-xs text-gray-400">Thank you for your business.</p>
    </div>
  );
}
