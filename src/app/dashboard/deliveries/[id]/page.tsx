import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { formatDateTime } from "@/lib/tz";
import { deliveryStatusVariants } from "../schema";
import { DeliveryStatusActions } from "../delivery-status-actions";
import { DeliveryDetailsForm } from "../delivery-details-form";

export default async function DeliveryDetailPage({ params }: PageProps<"/dashboard/deliveries/[id]">) {
  await requireSession();
  const { id } = await params;

  const delivery = await prisma.delivery.findUnique({
    where: { id },
    include: { customer: true, order: true },
  });

  if (!delivery) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/dashboard/deliveries">
            <ArrowLeft /> Back to deliveries
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">
              Delivery for order{" "}
              <Link href={`/dashboard/orders/${delivery.orderId}`} className="hover:underline">
                #{delivery.order.orderSeq}
              </Link>
            </h1>
            <p className="text-muted-foreground">{delivery.customer.name}</p>
          </div>
          <Badge variant={deliveryStatusVariants[delivery.status]}>{delivery.status.replace("_", " ")}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            <span className="text-muted-foreground">Address: </span>
            {delivery.address}
          </p>
          {delivery.dispatchedAt && (
            <p className="text-sm">
              <span className="text-muted-foreground">Dispatched: </span>
              {formatDateTime(delivery.dispatchedAt)}
            </p>
          )}
          {delivery.deliveredAt && (
            <p className="text-sm">
              <span className="text-muted-foreground">Delivered: </span>
              {formatDateTime(delivery.deliveredAt)}
            </p>
          )}
          <DeliveryStatusActions deliveryId={delivery.id} status={delivery.status} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Courier details</CardTitle>
        </CardHeader>
        <CardContent>
          <DeliveryDetailsForm
            deliveryId={delivery.id}
            defaultValues={{
              courierName: delivery.courierName ?? "",
              trackingRef: delivery.trackingRef ?? "",
              notes: delivery.notes ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
