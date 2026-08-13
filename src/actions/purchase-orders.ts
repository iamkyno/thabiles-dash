"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { Prisma } from "@/generated/prisma/client";

const poSchema = z.object({
  supplierId: z.string().min(1, "Select a supplier"),
  items: z
    .array(
      z.object({
        materialId: z.string().min(1),
        quantityOrdered: z.number().positive(),
        unitCost: z.number().min(0),
      })
    )
    .min(1, "Add at least one line item"),
});

export type PurchaseOrderInput = z.infer<typeof poSchema>;

export async function createPurchaseOrder(input: PurchaseOrderInput) {
  const session = await requireSession();
  const data = poSchema.parse(input);

  const lineItems = data.items.map((i) => {
    const unitCost = new Prisma.Decimal(i.unitCost);
    const lineTotal = unitCost.times(i.quantityOrdered);
    return {
      materialId: i.materialId,
      quantityOrdered: i.quantityOrdered,
      unitCost,
      lineTotal,
    };
  });
  const subtotal = lineItems.reduce((sum, i) => sum.plus(i.lineTotal), new Prisma.Decimal(0));

  const po = await prisma.purchaseOrder.create({
    data: {
      supplierId: data.supplierId,
      status: "ORDERED",
      orderedAt: new Date(),
      subtotal,
      total: subtotal,
      createdById: session.user.id,
      items: { create: lineItems },
    },
  });

  revalidatePath("/dashboard/purchase-orders");
  return { id: po.id };
}

export async function cancelPurchaseOrder(id: string) {
  await requireSession();
  const po = await prisma.purchaseOrder.findUniqueOrThrow({ where: { id } });
  if (po.status === "RECEIVED" || po.status === "PARTIALLY_RECEIVED") {
    throw new Error("Cannot cancel a purchase order that has already been received");
  }
  await prisma.purchaseOrder.update({ where: { id }, data: { status: "CANCELLED" } });
  revalidatePath("/dashboard/purchase-orders");
  revalidatePath(`/dashboard/purchase-orders/${id}`);
}

const receiveSchema = z.object({
  receipts: z.array(z.object({ itemId: z.string(), quantityReceived: z.number().min(0) })),
});

export async function receivePurchaseOrder(poId: string, input: z.infer<typeof receiveSchema>) {
  await requireSession();
  const data = receiveSchema.parse(input);

  await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUniqueOrThrow({ where: { id: poId }, include: { items: true } });
    if (po.status === "RECEIVED" || po.status === "CANCELLED") {
      throw new Error("This purchase order can no longer be received");
    }

    for (const receipt of data.receipts) {
      if (receipt.quantityReceived <= 0) continue;
      const item = po.items.find((i) => i.id === receipt.itemId);
      if (!item) continue;

      const receivedQty = new Prisma.Decimal(receipt.quantityReceived);
      const remaining = item.quantityOrdered.minus(item.quantityReceived);
      const applied = Prisma.Decimal.min(receivedQty, remaining);
      if (applied.lte(0)) continue;

      const material = await tx.material.findUniqueOrThrow({ where: { id: item.materialId } });
      const oldQty = material.stockQty;
      const newQty = oldQty.plus(applied);
      const newAvgCost = newQty.isZero()
        ? material.costPerUnit
        : oldQty.times(material.costPerUnit).plus(applied.times(item.unitCost)).dividedBy(newQty);

      await tx.material.update({
        where: { id: material.id },
        data: { stockQty: newQty, costPerUnit: newAvgCost },
      });

      await tx.purchaseOrderItem.update({
        where: { id: item.id },
        data: { quantityReceived: item.quantityReceived.plus(applied) },
      });
    }

    const updatedItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: poId } });
    const allReceived = updatedItems.every((i) => i.quantityReceived.gte(i.quantityOrdered));
    const anyReceived = updatedItems.some((i) => i.quantityReceived.gt(0));

    await tx.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: allReceived ? "RECEIVED" : anyReceived ? "PARTIALLY_RECEIVED" : po.status,
        receivedAt: allReceived ? new Date() : po.receivedAt,
      },
    });
  });

  revalidatePath(`/dashboard/purchase-orders/${poId}`);
  revalidatePath("/dashboard/purchase-orders");
  revalidatePath("/dashboard/materials");
}
