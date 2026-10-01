import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { productLabel } from "@/lib/product-label";
import { stockOrderStatusLabels, stockOrderStatusVariants } from "../schema";
import { StockOrderActions } from "../stock-order-actions";

export default async function StockOrderDetailPage({ params }: PageProps<"/dashboard/stock-orders/[id]">) {
  const session = await requireSession();
  await requireSection(session, "stock-orders");
  const { id } = await params;

  const order = await prisma.stockOrder.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, createdBy: true },
  });

  if (!order) notFound();

  const isOpen = order.status === "ORDERED";

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/dashboard/stock-orders">
            <ArrowLeft /> Back to stock orders
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Stock order #{order.stockOrderSeq}</h1>
            <p className="text-muted-foreground">
              Created by {order.createdBy.name} on {formatDateTime(order.createdAt)}
              {order.receivedAt && <> · Received {formatDateTime(order.receivedAt)}</>}
            </p>
          </div>
          <Badge variant={stockOrderStatusVariants[order.status]}>{stockOrderStatusLabels[order.status]}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          {isOpen && (
            <CardDescription>
              Marking this order as received adds these quantities to your product stock.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right whitespace-nowrap">Qty</TableHead>
                <TableHead className="hidden text-right whitespace-nowrap sm:table-cell">Unit cost</TableHead>
                <TableHead className="text-right whitespace-nowrap">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{productLabel(item.product)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{item.quantity}</TableCell>
                  <TableCell className="hidden text-right whitespace-nowrap sm:table-cell">
                    {formatMoney(item.unitCost)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatMoney(item.lineTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="ml-auto mt-4 flex max-w-xs justify-between text-sm font-semibold">
            <span>Total cost</span>
            <span>{formatMoney(order.total)}</span>
          </div>
        </CardContent>
        {isOpen && (
          <CardFooter>
            <StockOrderActions stockOrderId={order.id} />
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
