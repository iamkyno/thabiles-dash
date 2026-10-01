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
import { formatDate } from "@/lib/tz";
import { deliveryStatusVariants } from "./schema";

export default async function DeliveriesPage() {
  const session = await requireSession();
  await requireSection(session, "deliveries");
  const deliveries = await prisma.delivery.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true, order: true },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Deliveries</h1>
        <p className="text-muted-foreground">Track orders on their way to customers.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All deliveries</CardTitle>
          <CardDescription>{deliveries.length} deliveries</CardDescription>
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No deliveries yet. Mark an order as needing delivery to see it here.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <span className="sm:hidden">Delivery</span>
                    <span className="hidden sm:inline">Order</span>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Customer</TableHead>
                  <TableHead className="hidden sm:table-cell">Address</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => {
                  const orderCancelled = delivery.order.status === "CANCELLED";
                  const status = (
                    <>
                      <Badge variant={deliveryStatusVariants[delivery.status]}>
                        {delivery.status.replace("_", " ")}
                      </Badge>
                      {orderCancelled && <Badge variant="destructive">Order cancelled</Badge>}
                    </>
                  );
                  return (
                    <TableRow key={delivery.id} className={orderCancelled ? "opacity-60" : undefined}>
                      {/* On phones the whole row is one tappable link with the customer, address, status and date. */}
                      <TableCell className="p-0 sm:p-3">
                        <Link href={`/dashboard/deliveries/${delivery.id}`} className="block p-3 sm:p-0 sm:hover:underline">
                          <span className="font-medium whitespace-nowrap">Order #{delivery.order.orderSeq}</span>
                          <span className="sm:hidden"> · {delivery.customer.name}</span>
                          <span className="mt-1 block text-sm text-muted-foreground sm:hidden">{delivery.address}</span>
                          <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:hidden">
                            {status}
                            {formatDate(delivery.createdAt)}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{delivery.customer.name}</TableCell>
                      <TableCell className="hidden max-w-xs text-muted-foreground sm:table-cell">{delivery.address}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1">{status}</div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground whitespace-nowrap sm:table-cell">
                        {formatDate(delivery.createdAt)}
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
