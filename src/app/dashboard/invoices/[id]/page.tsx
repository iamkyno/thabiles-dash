import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { requireSession, requireSection } from "@/lib/session";
import { readBusinessProfile } from "@/lib/business-profile";
import { invoiceDisplayStatus, invoiceNumber, invoiceStatusLabels } from "@/lib/invoices";
import { formatMoney } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/tz";
import { invoiceStatusVariants, paymentMethodLabels } from "../schema";
import { RecordPaymentDialog } from "../record-payment-dialog";
import { ShareInvoiceDialog } from "../share-invoice-dialog";

export default async function InvoiceDetailPage({ params }: PageProps<"/dashboard/invoices/[id]">) {
  const session = await requireSession();
  await requireSection(session, "invoices");
  const { id } = await params;

  const [invoice, business] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        order: { include: { items: true } },
        payments: { orderBy: { paidAt: "desc" }, include: { recordedBy: true } },
      },
    }),
    readBusinessProfile(),
  ]);

  if (!invoice) notFound();

  const number = invoiceNumber(business.invoicePrefix, invoice.invoiceSeq);
  const status = invoiceDisplayStatus(invoice);
  const balance = Number(invoice.total) - Number(invoice.amountPaid);
  const canRecordPayment = invoice.status !== "VOID" && balance > 0;
  const due = invoice.dueAt ? formatDate(invoice.dueAt) : null;

  // The line about money in the message sent to the client.
  let shareMessage = `Amount due: ${formatMoney(balance)}${due ? ` by ${due}` : ""}.`;
  if (invoice.status === "VOID") shareMessage = "It has been cancelled, so nothing is owed.";
  else if (balance <= 0) shareMessage = "It's paid in full, thank you!";
  else if (status === "OVERDUE") shareMessage = `Amount due: ${formatMoney(balance)}, which was due on ${due}.`;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/dashboard/invoices">
            <ArrowLeft /> Back to invoices
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{number}</h1>
            <p className="text-muted-foreground">
              {invoice.customer.name} ·{" "}
              <Link href={`/dashboard/orders/${invoice.orderId}`} className="underline-offset-4 hover:underline">
                Order #{invoice.order.orderSeq}
              </Link>
            </p>
          </div>
          <Badge variant={invoiceStatusVariants[status]}>{invoiceStatusLabels[status]}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right whitespace-nowrap">Qty</TableHead>
                <TableHead className="text-right whitespace-nowrap">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{item.quantity}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatMoney(item.lineTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 space-y-1 text-sm sm:ml-auto sm:max-w-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Issued</span>
              <span>{invoice.issuedAt ? formatDate(invoice.issuedAt) : "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Due</span>
              <span className={status === "OVERDUE" ? "font-medium text-destructive" : undefined}>{due ?? "—"}</span>
            </div>
            <div className="flex justify-between gap-4 border-t pt-1">
              <span className="text-muted-foreground">Total</span>
              <span>{formatMoney(invoice.total)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Paid</span>
              <span>{formatMoney(invoice.amountPaid)}</span>
            </div>
            <div className="flex justify-between gap-4 font-semibold">
              <span>Balance due</span>
              <span>{formatMoney(invoice.status === "VOID" ? 0 : balance)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 *:w-full sm:flex-row sm:flex-wrap sm:*:w-auto">
          <ShareInvoiceDialog
            invoiceId={invoice.id}
            number={number}
            businessName={business.businessName}
            initialToken={invoice.shareToken}
            customer={{
              name: invoice.customer.name,
              contactName: invoice.customer.contactName,
              phone: invoice.customer.phone,
              email: invoice.customer.email,
            }}
            message={shareMessage}
          />
          {canRecordPayment && <RecordPaymentDialog invoiceId={invoice.id} balance={balance} />}
          <Button variant="outline" asChild>
            <Link href={`/print/invoices/${invoice.id}`} target="_blank">
              <Printer /> Print / PDF
            </Link>
          </Button>
          {invoice.shareToken && (
            <p className="text-sm text-muted-foreground sm:basis-full">
              A view-only link is on for this invoice. Open Share to send it again or turn it off.
            </p>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {invoice.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="hidden sm:table-cell">Method</TableHead>
                  <TableHead className="hidden sm:table-cell">Reference</TableHead>
                  <TableHead className="hidden sm:table-cell">Recorded by</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <span className="whitespace-nowrap">{formatDateTime(p.paidAt)}</span>
                      {/* Phones: method and reference under the date instead of in their own columns. */}
                      <span className="block text-xs text-muted-foreground sm:hidden">
                        {paymentMethodLabels[p.method]}
                        {p.reference && ` · ${p.reference}`}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{paymentMethodLabels[p.method]}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{p.reference || "—"}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{p.recordedBy.name}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatMoney(p.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
