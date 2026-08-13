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
import { requireSession } from "@/lib/session";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/tz";
import { invoiceStatusVariants } from "./schema";

export default async function InvoicesPage() {
  await requireSession();
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
                  <TableHead>Issued</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
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
                    <TableCell className="text-muted-foreground">
                      {inv.issuedAt ? formatDate(inv.issuedAt) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {inv.dueAt ? formatDate(inv.dueAt) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={invoiceStatusVariants[inv.status]}>{inv.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
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
