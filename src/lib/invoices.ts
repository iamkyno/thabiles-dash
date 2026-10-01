import type { InvoiceStatus } from "@/generated/prisma/enums";

export function invoiceNumber(prefix: string | null | undefined, invoiceSeq: number) {
  return `${prefix?.trim() || "INV"}-${invoiceSeq}`;
}

// The status to show people. An unpaid invoice past its due date shows as overdue;
// this is worked out when the page loads and never saved, so nothing has to run to keep it current.
export function invoiceDisplayStatus(
  invoice: { status: InvoiceStatus; dueAt: Date | null },
  now = new Date()
): InvoiceStatus {
  const unpaid = invoice.status === "SENT" || invoice.status === "PARTIALLY_PAID";
  if (unpaid && invoice.dueAt && invoice.dueAt < now) return "OVERDUE";
  return invoice.status;
}

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  DRAFT: "DRAFT",
  SENT: "UNPAID",
  PARTIALLY_PAID: "PART PAID",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  VOID: "VOID",
};
