import Link from "next/link";
import { Plus } from "lucide-react";

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
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/tz";
import { poStatusVariants } from "./schema";

export default async function PurchaseOrdersPage() {
  await requireSession();
  const orders = await prisma.purchaseOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: { supplier: true },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Purchase orders</h1>
          <p className="text-muted-foreground">Orders placed with suppliers for ingredients and packaging.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/purchase-orders/new">
            <Plus /> New purchase order
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All purchase orders</CardTitle>
          <CardDescription>{orders.length} purchase orders</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No purchase orders yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/purchase-orders/${po.id}`} className="hover:underline">
                        PO-{po.poSeq}
                      </Link>
                    </TableCell>
                    <TableCell>{po.supplier.name}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(po.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={poStatusVariants[po.status]}>{po.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatMoney(po.total)}</TableCell>
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
