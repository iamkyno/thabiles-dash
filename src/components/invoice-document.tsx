import type { Prisma } from "@/generated/prisma/client";
import type { InvoiceBusiness } from "@/lib/business-profile";
import { invoiceDisplayStatus, invoiceNumber } from "@/lib/invoices";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/tz";

type InvoiceWithLines = Prisma.InvoiceGetPayload<{
  include: { customer: true; order: { include: { items: true } } };
}>;

const stamps: Partial<Record<string, { text: string; className: string }>> = {
  PAID: { text: "Paid in full", className: "border-green-700 text-green-700" },
  PARTIALLY_PAID: { text: "Part paid", className: "border-amber-600 text-amber-700" },
  OVERDUE: { text: "Overdue", className: "border-red-600 text-red-600" },
  VOID: { text: "Void — nothing to pay", className: "border-gray-400 text-gray-500" },
};

// The invoice as the client sees it: used by the print page and the client's shared link.
export function InvoiceDocument({ invoice, business }: { invoice: InvoiceWithLines; business: InvoiceBusiness }) {
  const number = invoiceNumber(business.invoicePrefix, invoice.invoiceSeq);
  const balance = Number(invoice.total) - Number(invoice.amountPaid);
  const status = invoiceDisplayStatus(invoice);
  const stamp = stamps[status];
  const hasDiscount = Number(invoice.discountTotal) > 0;
  const hasTax = Number(invoice.taxTotal) > 0;
  const owing = balance > 0 && status !== "VOID";
  const { customer } = invoice;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold">{business.businessName}</h1>
          {business.address && <p className="text-sm whitespace-pre-line text-gray-600">{business.address}</p>}
          {business.phone && <p className="text-sm text-gray-600">{business.phone}</p>}
          {business.email && <p className="text-sm break-all text-gray-600">{business.email}</p>}
          {business.taxNumber && <p className="text-sm text-gray-600">Tax no: {business.taxNumber}</p>}
        </div>
        <div className="space-y-0.5 sm:text-right">
          <h2 className="text-xl font-semibold">Invoice {number}</h2>
          <p className="text-sm text-gray-600">Issued {invoice.issuedAt ? formatDate(invoice.issuedAt) : "—"}</p>
          <p className="text-sm text-gray-600">Due {invoice.dueAt ? formatDate(invoice.dueAt) : "—"}</p>
          {stamp && (
            <p
              className={`mt-2 inline-block rounded border-2 px-2 py-0.5 text-xs font-bold tracking-wide uppercase ${stamp.className}`}
            >
              {stamp.text}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-0.5">
        <p className="text-sm font-medium text-gray-500">Billed to</p>
        <p className="font-medium">{customer.name}</p>
        {customer.contactName && <p className="text-sm text-gray-600">{customer.contactName}</p>}
        {customer.phone && <p className="text-sm text-gray-600">{customer.phone}</p>}
        {customer.email && <p className="text-sm break-all text-gray-600">{customer.email}</p>}
        {customer.address && <p className="text-sm whitespace-pre-line text-gray-600">{customer.address}</p>}
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-300 text-left">
            <th className="py-2 pr-2">Item</th>
            <th className="py-2 pr-2 text-right">Qty</th>
            <th className="hidden py-2 pr-2 text-right sm:table-cell">Price</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.order.items.map((item) => (
            <tr key={item.id} className="border-b border-gray-200 align-top">
              <td className="py-2 pr-2">{item.description}</td>
              <td className="py-2 pr-2 text-right">{item.quantity}</td>
              <td className="hidden py-2 pr-2 text-right whitespace-nowrap sm:table-cell">
                {formatMoney(item.unitPrice)}
              </td>
              <td className="py-2 text-right whitespace-nowrap">{formatMoney(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto max-w-xs space-y-1 text-sm">
        {(hasDiscount || hasTax) && (
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatMoney(invoice.subtotal)}</span>
          </div>
        )}
        {hasDiscount && (
          <div className="flex justify-between">
            <span className="text-gray-500">Discount</span>
            <span>-{formatMoney(invoice.discountTotal)}</span>
          </div>
        )}
        {hasTax && (
          <div className="flex justify-between">
            <span className="text-gray-500">Tax</span>
            <span>{formatMoney(invoice.taxTotal)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-300 pt-1 font-semibold">
          <span>Total</span>
          <span>{formatMoney(invoice.total)}</span>
        </div>
        {Number(invoice.amountPaid) > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Paid</span>
            <span>{formatMoney(invoice.amountPaid)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold">
          <span>Balance due</span>
          <span>{formatMoney(status === "VOID" ? 0 : balance)}</span>
        </div>
      </div>

      {owing && business.paymentDetails && (
        <div className="rounded-md border border-gray-300 p-4">
          <p className="text-sm font-semibold">How to pay</p>
          <p className="mt-1 text-sm whitespace-pre-line text-gray-700">{business.paymentDetails}</p>
          <p className="mt-2 text-sm text-gray-700">
            Please use <span className="font-semibold">{number}</span> as your payment reference.
          </p>
        </div>
      )}

      {invoice.notes && (
        <div>
          <p className="text-sm font-medium text-gray-500">Notes</p>
          <p className="text-sm whitespace-pre-line">{invoice.notes}</p>
        </div>
      )}

      <p className="text-center text-xs text-gray-400">Thank you for your business.</p>
    </div>
  );
}
