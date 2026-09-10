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
import { formatDateTime } from "@/lib/tz";
import { orderStatusVariants } from "./schema";

export default async function OrdersPage() {
  const session = await requireSession();
  await requireSection(session, "orders");
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true, invoice: true, delivery: true },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-muted-foreground">Customer sales orders.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/orders/new">
            <Plus /> New order
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All orders</CardTitle>
          <CardDescription>{orders.length} orders</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Delivery</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/orders/${order.id}`} className="hover:underline">
                        #{order.orderSeq}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDateTime(order.createdAt)}</TableCell>
                    <TableCell>{order.customer.name}</TableCell>
                    <TableCell>
                      <Badge variant={orderStatusVariants[order.status]}>{order.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {order.delivery ? order.delivery.status.replace("_", " ") : "—"}
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
