"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSession, requireSection } from "@/lib/session";
import { runAction, UserError } from "@/lib/action-result";
import { deliveryDetailsSchema, type DeliveryDetailsValues } from "@/app/dashboard/deliveries/schema";

const statusSchema = z.enum(["PENDING", "IN_TRANSIT", "DELIVERED", "FAILED"]);

function revalidateDelivery(id: string, orderId: string) {
  revalidatePath("/dashboard/deliveries");
  revalidatePath(`/dashboard/deliveries/${id}`);
  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard");
}

export async function updateDeliveryStatus(id: string, status: z.infer<typeof statusSchema>) {
  const session = await requireSession();
  await requireSection(session, "deliveries");
  const nextStatus = statusSchema.parse(status);

  return runAction(async () => {
    const delivery = await prisma.delivery.findUniqueOrThrow({ where: { id }, include: { order: true } });
    if (delivery.order.status === "CANCELLED") {
      throw new UserError(`Order #${delivery.order.orderSeq} was cancelled, so this delivery can't be updated`);
    }

    await prisma.delivery.update({
      where: { id },
      data: {
        status: nextStatus,
        dispatchedAt: nextStatus === "IN_TRANSIT" ? new Date() : undefined,
        deliveredAt: nextStatus === "DELIVERED" ? new Date() : undefined,
      },
    });

    revalidateDelivery(id, delivery.orderId);
    return null;
  });
}

export async function updateDeliveryDetails(id: string, input: DeliveryDetailsValues) {
  const session = await requireSession();
  await requireSection(session, "deliveries");
  const data = deliveryDetailsSchema.parse(input);

  return runAction(async () => {
    const delivery = await prisma.delivery.update({
      where: { id },
      data: {
        address: data.address,
        courierName: data.courierName.trim() || null,
        trackingRef: data.trackingRef.trim() || null,
        notes: data.notes.trim() || null,
      },
    });
    revalidateDelivery(id, delivery.orderId);
    return null;
  });
}
