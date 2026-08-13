"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const statusSchema = z.enum(["PENDING", "IN_TRANSIT", "DELIVERED", "FAILED"]);

export async function updateDeliveryStatus(id: string, status: z.infer<typeof statusSchema>) {
  await requireSession();
  const nextStatus = statusSchema.parse(status);

  await prisma.delivery.update({
    where: { id },
    data: {
      status: nextStatus,
      dispatchedAt: nextStatus === "IN_TRANSIT" ? new Date() : undefined,
      deliveredAt: nextStatus === "DELIVERED" ? new Date() : undefined,
    },
  });

  revalidatePath("/dashboard/deliveries");
  revalidatePath(`/dashboard/deliveries/${id}`);
}

const detailsSchema = z.object({
  courierName: z.string().optional(),
  trackingRef: z.string().optional(),
  notes: z.string().optional(),
});

export async function updateDeliveryDetails(id: string, input: z.infer<typeof detailsSchema>) {
  await requireSession();
  const data = detailsSchema.parse(input);
  await prisma.delivery.update({ where: { id }, data });
  revalidatePath(`/dashboard/deliveries/${id}`);
}
