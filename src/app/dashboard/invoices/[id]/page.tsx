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
import { requireSession } from "@/lib/session";
import { formatMoney } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/tz";
import { invoiceStatusVariants, paymentMethodLabels } from "../schema";
import { RecordPaymentDialog } from "../record-payment-dialog";

export default async function InvoiceDetailPage({ params }: PageProps<"/dashboard/invoices/[id]">) {
  await requireSession();
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      order: { include: { items: true } },
      payments: { orderBy: { paidAt: "desc" }, include: { recordedBy: true } },
    },
  });

  if (!invoice) notFound();

  const balance = Number(invoice.total) - Number(invoice.amountPaid);
  const canRecordPayment = invoice.status !== "PAID" && invoice.status !== "VOID";

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/dashboard/invoices">
            <ArrowLeft /> Back to invoices
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">INV-{invoice.invoiceSeq}</h1>
            <p className="text-muted-foreground">
              {invoice.customer.name} · Issued {invoice.issuedAt ? formatDate(invoice.issuedAt) : "—"}
            </p>
          </div>
          <Badge variant={invoiceStatusVariants[invoice.status]}>{invoice.status.replace("_", " ")}</Badge>
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
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatMoney(item.lineTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span>{formatMoney(invoice.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid</span>
              <span>{formatMoney(invoice.amountPaid)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Balance due</span>
              <span>{formatMoney(balance)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          {canRecordPayment && <RecordPaymentDialog invoiceId={invoice.id} balance={balance} />}
          <Button variant="outline" asChild>
            <Link href={`/print/invoices/${invoice.id}`} target="_blank">
              <Printer /> Print / PDF
            </Link>
          </Button>
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
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Recorded by</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDateTime(p.paidAt)}</TableCell>
                    <TableCell>{paymentMethodLabels[p.method]}</TableCell>
                    <TableCell className="text-muted-foreground">{p.reference || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{p.recordedBy.name}</TableCell>
                    <TableCell className="text-right">{formatMoney(p.amount)}</TableCell>
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
