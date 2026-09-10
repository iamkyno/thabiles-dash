import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/tz";
import { invoiceStatusVariants } from "./schema";

export default async function InvoicesPage() {
  const session = await requireSession();
  await requireSection(session, "invoices");
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <p className="text-muted-foreground">Track what's owed and what's been paid.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All invoices</CardTitle>
          <CardDescription>{invoices.length} invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No invoices yet. Generate one from a fulfilled order.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden sm:table-cell">Issued</TableHead>
                  <TableHead className="hidden sm:table-cell">Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/invoices/${inv.id}`} className="hover:underline">
                        INV-{inv.invoiceSeq}
                      </Link>
                    </TableCell>
                    <TableCell>{inv.customer.name}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {inv.issuedAt ? formatDate(inv.issuedAt) : "—"}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {inv.dueAt ? formatDate(inv.dueAt) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={invoiceStatusVariants[inv.status]}>{inv.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatMoney(Number(inv.total) - Number(inv.amountPaid))}
                    </TableCell>
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
