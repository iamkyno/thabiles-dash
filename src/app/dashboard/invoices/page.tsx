import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession, requireSection } from "@/lib/session";
import { readBusinessProfile } from "@/lib/business-profile";
import { invoiceDisplayStatus, invoiceNumber, invoiceStatusLabels } from "@/lib/invoices";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/tz";
import { invoiceStatusVariants } from "./schema";

const filters = [
  { key: "all", label: "All" },
  { key: "unpaid", label: "Unpaid" },
  { key: "overdue", label: "Overdue" },
  { key: "paid", label: "Paid" },
] as const;
type FilterKey = (typeof filters)[number]["key"];

export default async function InvoicesPage({ searchParams }: PageProps<"/dashboard/invoices">) {
  const session = await requireSession();
  await requireSection(session, "invoices");
  const { show } = await searchParams;
  const filter: FilterKey = filters.some((f) => f.key === show) ? (show as FilterKey) : "all";

  const now = new Date();
  const unpaid: Prisma.InvoiceWhereInput = { status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] } };
  const overdue: Prisma.InvoiceWhereInput = { ...unpaid, dueAt: { lt: now } };
  const where: Record<FilterKey, Prisma.InvoiceWhereInput> = {
    all: {},
    unpaid,
    overdue,
    paid: { status: "PAID" },
  };

  const [invoices, owed, late, business] = await Promise.all([
    prisma.invoice.findMany({
      where: where[filter],
      orderBy: { createdAt: "desc" },
      include: { customer: true },
      take: 100,
    }),
    prisma.invoice.aggregate({ where: unpaid, _sum: { total: true, amountPaid: true }, _count: { _all: true } }),
    prisma.invoice.aggregate({ where: overdue, _sum: { total: true, amountPaid: true }, _count: { _all: true } }),
    readBusinessProfile(),
  ]);

  const owedAmount = Number(owed._sum.total ?? 0) - Number(owed._sum.amountPaid ?? 0);
  const lateAmount = Number(late._sum.total ?? 0) - Number(late._sum.amountPaid ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <p className="text-muted-foreground">Track what&apos;s owed, record payments and send invoices to clients.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <Link href="/dashboard/invoices?show=unpaid" className="rounded-lg border bg-card p-4 hover:bg-muted/50">
          <p className="text-sm text-muted-foreground">Still owed</p>
          <p className="mt-1 text-lg font-semibold whitespace-nowrap">{formatMoney(owedAmount)}</p>
          <p className="text-xs text-muted-foreground">
            {owed._count._all} invoice{owed._count._all === 1 ? "" : "s"}
          </p>
        </Link>
        <Link href="/dashboard/invoices?show=overdue" className="rounded-lg border bg-card p-4 hover:bg-muted/50">
          <p className="text-sm text-muted-foreground">Overdue</p>
          <p
            className={`mt-1 text-lg font-semibold whitespace-nowrap ${lateAmount > 0 ? "text-destructive" : ""}`}
          >
            {formatMoney(lateAmount)}
          </p>
          <p className="text-xs text-muted-foreground">
            {late._count._all} invoice{late._count._all === 1 ? "" : "s"}
          </p>
        </Link>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div>
            <CardTitle>{filter === "all" ? "All invoices" : `${filters.find((f) => f.key === filter)?.label} invoices`}</CardTitle>
            <CardDescription>
              {invoices.length} invoice{invoices.length === 1 ? "" : "s"}
            </CardDescription>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="Filter invoices">
            {filters.map((f) => (
              <Button key={f.key} size="sm" variant={f.key === filter ? "default" : "outline"} asChild>
                <Link href={f.key === "all" ? "/dashboard/invoices" : `/dashboard/invoices?show=${f.key}`}>
                  {f.label}
                </Link>
              </Button>
            ))}
          </nav>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {filter === "all"
                ? "No invoices yet. Open an order and tap Generate invoice."
                : "No invoices here right now."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="hidden sm:table-cell">Customer</TableHead>
                  <TableHead className="hidden sm:table-cell">Issued</TableHead>
                  <TableHead className="hidden sm:table-cell">Due</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden text-right whitespace-nowrap sm:table-cell">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => {
                  const status = invoiceDisplayStatus(inv, now);
                  const balance = inv.status === "VOID" ? 0 : Number(inv.total) - Number(inv.amountPaid);
                  const badge = (
                    <Badge variant={invoiceStatusVariants[status]}>{invoiceStatusLabels[status]}</Badge>
                  );
                  const showDue = inv.dueAt && balance > 0;
                  return (
                    <TableRow key={inv.id} className={inv.status === "VOID" ? "opacity-60" : undefined}>
                      {/* On phones the whole row is one tappable link with the customer, status, due date and balance. */}
                      <TableCell className="p-0 sm:p-3">
                        <Link
                          href={`/dashboard/invoices/${inv.id}`}
                          className="flex items-start justify-between gap-3 p-3 sm:block sm:p-0 sm:hover:underline"
                        >
                          <span className="min-w-0">
                            <span className="font-medium whitespace-nowrap">
                              {invoiceNumber(business.invoicePrefix, inv.invoiceSeq)}
                            </span>
                            <span className="sm:hidden"> · {inv.customer.name}</span>
                            <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:hidden">
                              {badge}
                              {showDue && inv.dueAt && `Due ${formatDate(inv.dueAt)}`}
                            </span>
                          </span>
                          <span className="font-medium whitespace-nowrap sm:hidden">{formatMoney(balance)}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{inv.customer.name}</TableCell>
                      <TableCell className="hidden text-muted-foreground whitespace-nowrap sm:table-cell">
                        {inv.issuedAt ? formatDate(inv.issuedAt) : "—"}
                      </TableCell>
                      <TableCell
                        className={`hidden whitespace-nowrap sm:table-cell ${status === "OVERDUE" ? "text-destructive" : "text-muted-foreground"}`}
                      >
                        {inv.dueAt ? formatDate(inv.dueAt) : "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{badge}</TableCell>
                      <TableCell className="hidden text-right whitespace-nowrap sm:table-cell">
                        {formatMoney(balance)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
