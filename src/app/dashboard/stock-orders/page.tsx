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
import { requireSession, requireSection } from "@/lib/session";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/tz";
import { stockOrderStatusLabels, stockOrderStatusVariants } from "./schema";

export default async function StockOrdersPage() {
  const session = await requireSession();
  await requireSection(session, "stock-orders");
  const orders = await prisma.stockOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: { select: { name: true } } } } },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Stock orders</h1>
          <p className="text-muted-foreground">Restock your products. Stock goes up when an order is received.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/stock-orders/new">
            <Plus /> New stock order
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All stock orders</CardTitle>
          <CardDescription>{orders.length} stock orders</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No stock orders yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/stock-orders/${order.id}`} className="hover:underline">
                        #{order.stockOrderSeq}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="space-y-1">
                      {order.items.slice(0, 2).map((i) => (
                        <div key={i.id}>
                          {i.product.name} <span className="whitespace-nowrap text-muted-foreground">× {i.quantity}</span>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <div className="text-muted-foreground">+{order.items.length - 2} more</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={stockOrderStatusVariants[order.status]}>
                        {stockOrderStatusLabels[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatMoney(order.total)}</TableCell>
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
