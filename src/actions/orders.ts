"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { Prisma } from "@/generated/prisma/client";

const orderSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  items: z
    .array(z.object({ productId: z.string().min(1), quantity: z.number().int().positive() }))
    .min(1, "Add at least one product"),
  discountTotal: z.number().min(0),
  taxRatePercent: z.number().min(0).max(100),
  needsDelivery: z.boolean(),
  deliveryAddress: z.string().optional(),
});

export type OrderInput = z.infer<typeof orderSchema>;

export async function createOrder(input: OrderInput) {
  const session = await requireSession();
  const data = orderSchema.parse(input);

  if (data.needsDelivery && !data.deliveryAddress?.trim()) {
    throw new Error("Enter a delivery address");
  }

  const order = await prisma.$transaction(async (tx) => {
    const lineItems: {
      productId: string;
      description: string;
      quantity: number;
      unitPrice: Prisma.Decimal;
      lineTotal: Prisma.Decimal;
    }[] = [];

    for (const item of data.items) {
      const product = await tx.finishedProduct.findUniqueOrThrow({ where: { id: item.productId } });
      const decremented = await tx.finishedProduct.updateMany({
        where: { id: item.productId, stockQty: { gte: item.quantity } },
        data: { stockQty: { decrement: item.quantity } },
      });
      if (decremented.count === 0) {
        throw new Error(`Not enough stock for ${product.name}`);
      }
      lineItems.push({
        productId: product.id,
        description: product.name,
        quantity: item.quantity,
        unitPrice: product.sellPrice,
        lineTotal: product.sellPrice.times(item.quantity),
      });
    }

    const subtotal = lineItems.reduce((sum, i) => sum.plus(i.lineTotal), new Prisma.Decimal(0));
    const taxTotal = subtotal.times(data.taxRatePercent).dividedBy(100);
    const discountTotal = new Prisma.Decimal(data.discountTotal);
    const total = subtotal.plus(taxTotal).minus(discountTotal);

    const createdOrder = await tx.order.create({
      data: {
        customerId: data.customerId,
        createdById: session.user.id,
        status: "PENDING",
        subtotal,
        taxTotal,
        discountTotal,
        total,
        items: { create: lineItems },
      },
    });

    if (data.needsDelivery && data.deliveryAddress) {
      await tx.delivery.create({
        data: {
          orderId: createdOrder.id,
          customerId: data.customerId,
          address: data.deliveryAddress,
          status: "PENDING",
        },
      });
    }

    return createdOrder;
  });

  revalidatePath("/dashboard/orders");
  return { id: order.id };
}

export async function confirmOrder(id: string) {
  await requireSession();
  await prisma.order.update({ where: { id }, data: { status: "CONFIRMED" } });
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${id}`);
}

export async function fulfillOrder(id: string) {
  await requireSession();
  await prisma.order.update({ where: { id }, data: { status: "FULFILLED" } });
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${id}`);
}

export async function cancelOrder(id: string) {
  await requireSession();

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id },
      include: { items: true, invoice: true },
    });
    if (order.status === "CANCELLED") return;
    if (order.invoice) {
      throw new Error("Cannot cancel an order that already has an invoice");
    }

    for (const item of order.items) {
      await tx.finishedProduct.update({
        where: { id: item.productId },
        data: { stockQty: { increment: item.quantity } },
      });
    }

    await tx.order.update({ where: { id }, data: { status: "CANCELLED" } });
  });

  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${id}`);
}
