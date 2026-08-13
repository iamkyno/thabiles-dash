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
import { formatDateTime } from "@/lib/tz";
import { orderStatusVariants } from "./schema";

export default async function OrdersPage() {
  await requireSession();
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
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead className="text-right">Total</TableHead>
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
                    <TableCell className="text-muted-foreground">{formatDateTime(order.createdAt)}</TableCell>
                    <TableCell>{order.customer.name}</TableCell>
                    <TableCell>
                      <Badge variant={orderStatusVariants[order.status]}>{order.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.delivery ? order.delivery.status.replace("_", " ") : "—"}
                    </TableCell>
                    <TableCell className="text-right">{formatMoney(order.total)}</TableCell>
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
