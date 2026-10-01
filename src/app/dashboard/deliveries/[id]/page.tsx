import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireSession, requireSection } from "@/lib/session";
import { formatDateTime } from "@/lib/tz";
import { deliveryStatusVariants } from "../schema";
import { DeliveryStatusActions } from "../delivery-status-actions";
import { DeliveryDetailsForm } from "../delivery-details-form";

export default async function DeliveryDetailPage({ params }: PageProps<"/dashboard/deliveries/[id]">) {
  const session = await requireSession();
  await requireSection(session, "deliveries");
  const { id } = await params;

  const delivery = await prisma.delivery.findUnique({
    where: { id },
    include: { customer: true, order: true },
  });

  if (!delivery) notFound();
  const orderCancelled = delivery.order.status === "CANCELLED";

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

      {orderCancelled && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-medium">Order #{delivery.order.orderSeq} was cancelled.</p>
          <p className="text-muted-foreground">This delivery doesn&apos;t need to go out, so its status can no longer be changed.</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <p className="text-muted-foreground">Address</p>
            <p className="whitespace-pre-line">{delivery.address}</p>
          </div>
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
          {!orderCancelled && <DeliveryStatusActions deliveryId={delivery.id} status={delivery.status} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery details</CardTitle>
        </CardHeader>
        <CardContent>
          <DeliveryDetailsForm
            deliveryId={delivery.id}
            defaultValues={{
              address: delivery.address,
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
