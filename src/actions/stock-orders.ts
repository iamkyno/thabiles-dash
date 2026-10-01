"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireSession, requireSection } from "@/lib/session";
import { runAction, UserError } from "@/lib/action-result";
import { Prisma } from "@/generated/prisma/client";
import { stockOrderSchema, type StockOrderFormValues } from "@/app/dashboard/stock-orders/schema";

function revalidateStockPages(id?: string) {
  revalidatePath("/dashboard/stock-orders");
  if (id) revalidatePath(`/dashboard/stock-orders/${id}`);
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard");
}

export async function createStockOrder(input: StockOrderFormValues) {
  const session = await requireSession();
  await requireSection(session, "stock-orders");
  const data = stockOrderSchema.parse(input);

  return runAction(async () => {
    const comboCount = await prisma.finishedProduct.count({
      where: { id: { in: data.items.map((i) => i.productId) }, isCombo: true },
    });
    if (comboCount > 0) {
      throw new UserError("Combos are made from your products' stock — order the products instead");
    }

    const lineItems = data.items.map((i) => {
      const unitCost = new Prisma.Decimal(i.unitCost);
      return {
        productId: i.productId,
        quantity: i.quantity,
        unitCost,
        lineTotal: unitCost.times(i.quantity),
      };
    });
    const total = lineItems.reduce((sum, i) => sum.plus(i.lineTotal), new Prisma.Decimal(0));

    const order = await prisma.stockOrder.create({
      data: {
        total,
        createdById: session.user.id,
        items: { create: lineItems },
      },
    });

    revalidateStockPages();
    return { id: order.id };
  });
}

export async function receiveStockOrder(id: string) {
  const session = await requireSession();
  await requireSection(session, "stock-orders");

  return runAction(async () => {
    await prisma.$transaction(async (tx) => {
      // Flip status first, guarded on ORDERED, so stock can only ever be added once per order.
      const { count } = await tx.stockOrder.updateMany({
        where: { id, status: "ORDERED" },
        data: { status: "RECEIVED", receivedAt: new Date() },
      });
      if (count === 0) throw new UserError("This stock order has already been received or cancelled");

      const items = await tx.stockOrderItem.findMany({ where: { stockOrderId: id } });
      for (const item of items) {
        await tx.finishedProduct.update({
          where: { id: item.productId },
          data: { stockQty: { increment: item.quantity } },
        });
      }
    });

    revalidateStockPages(id);
    return null;
  });
}

export async function cancelStockOrder(id: string) {
  const session = await requireSession();
  await requireSection(session, "stock-orders");

  return runAction(async () => {
    const { count } = await prisma.stockOrder.updateMany({
      where: { id, status: "ORDERED" },
      data: { status: "CANCELLED" },
    });
    if (count === 0) throw new UserError("Only stock orders that haven't been received can be cancelled");

    revalidateStockPages(id);
    return null;
  });
}
