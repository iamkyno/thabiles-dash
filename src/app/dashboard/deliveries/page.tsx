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
import { formatDate } from "@/lib/tz";
import { deliveryStatusVariants } from "./schema";

export default async function DeliveriesPage() {
  await requireSession();
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
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/deliveries/${delivery.id}`} className="hover:underline">
                        Order #{delivery.order.orderSeq}
                      </Link>
                    </TableCell>
                    <TableCell>{delivery.customer.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{delivery.address}</TableCell>
                    <TableCell>
                      <Badge variant={deliveryStatusVariants[delivery.status]}>
                        {delivery.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(delivery.createdAt)}</TableCell>
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
