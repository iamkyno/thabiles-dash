import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

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
import { invoiceNumber } from "@/lib/invoices";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/tz";
import { orderStatusVariants } from "../schema";
import { OrderActions } from "../order-actions";
import { GenerateInvoiceButton } from "../generate-invoice-button";
import { DeleteOrderButton } from "../delete-order-button";

export default async function OrderDetailPage({ params }: PageProps<"/dashboard/orders/[id]">) {
  const session = await requireSession();
  await requireSection(session, "orders");
  const { id } = await params;

  const [order, business] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        invoice: { include: { _count: { select: { payments: true } } } },
        delivery: true,
        createdBy: true,
      },
    }),
    readBusinessProfile(),
  ]);

  if (!order) notFound();
  const canEdit = order.status !== "CANCELLED" && !order.invoice;
  const canDelete = session.user.role === "ADMIN" || session.user.role === "DEVELOPER";

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/dashboard/orders">
            <ArrowLeft /> Back to orders
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Order #{order.orderSeq}</h1>
            <p className="text-muted-foreground">
              {formatDateTime(order.createdAt)} · Created by {order.createdBy.name}
            </p>
          </div>
          <Badge variant={orderStatusVariants[order.status]}>{order.status}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{order.customer.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right whitespace-nowrap">Qty</TableHead>
                <TableHead className="hidden text-right whitespace-nowrap sm:table-cell">Unit price</TableHead>
                <TableHead className="text-right whitespace-nowrap">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{item.quantity}</TableCell>
                  <TableCell className="hidden text-right whitespace-nowrap sm:table-cell">{formatMoney(item.unitPrice)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatMoney(item.lineTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatMoney(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatMoney(order.taxTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>-{formatMoney(order.discountTotal)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatMoney(order.total)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 *:w-full sm:flex-row sm:flex-wrap sm:*:w-auto">
          {canEdit && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/orders/${order.id}/edit`}>
                <Pencil /> Edit order
              </Link>
            </Button>
          )}
          <OrderActions orderId={order.id} status={order.status} />
          {order.invoice ? (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/invoices/${order.invoice.id}`}>
                View invoice {invoiceNumber(business.invoicePrefix, order.invoice.invoiceSeq)}
              </Link>
            </Button>
          ) : (
            order.status !== "CANCELLED" && <GenerateInvoiceButton orderId={order.id} />
          )}
          {canDelete && (
            <DeleteOrderButton
              orderId={order.id}
              orderSeq={order.orderSeq}
              returnsStock={order.status !== "CANCELLED"}
              hasDelivery={Boolean(order.delivery)}
              invoice={
                order.invoice && {
                  number: invoiceNumber(business.invoicePrefix, order.invoice.invoiceSeq),
                  paymentCount: order.invoice._count.payments,
                  amountPaid: Number(order.invoice.amountPaid),
                }
              }
            />
          )}
          {order.invoice && order.status !== "CANCELLED" && (
            <p className="text-sm text-muted-foreground sm:basis-full">
              This order has an invoice, so it can no longer be edited.
            </p>
          )}
        </CardFooter>
      </Card>

      {order.delivery && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Status: </span>
              <Badge variant="secondary">{order.delivery.status.replace("_", " ")}</Badge>
            </p>
            <p>
              <span className="text-muted-foreground">Address: </span>
              {order.delivery.address}
            </p>
            <Link href={`/dashboard/deliveries/${order.delivery.id}`} className="inline-block text-sm hover:underline">
              Manage delivery →
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
