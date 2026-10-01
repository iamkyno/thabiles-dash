"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSession, requireSection } from "@/lib/session";
import { runAction, UserError } from "@/lib/action-result";
import { productLabel } from "@/lib/product-label";
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
  await requireSection(session, "orders");
  const data = orderSchema.parse(input);

  return runAction(async () => {
    if (data.needsDelivery && !data.deliveryAddress?.trim()) {
      throw new UserError("Enter a delivery address");
    }

    const order = await prisma.$transaction(async (tx) => {
      const lineItems: {
        productId: string;
        description: string;
        quantity: number;
        unitPrice: Prisma.Decimal;
        lineTotal: Prisma.Decimal;
      }[] = [];

      // Combos are sold from their products' stock, so total up what the whole order needs per product.
      const needed = new Map<string, { name: string; quantity: number; forCombos: Set<string> }>();
      const need = (id: string, name: string, quantity: number, comboName?: string) => {
        const entry = needed.get(id) ?? { name, quantity: 0, forCombos: new Set<string>() };
        entry.quantity += quantity;
        if (comboName) entry.forCombos.add(comboName);
        needed.set(id, entry);
      };

      for (const item of data.items) {
        const product = await tx.finishedProduct.findUniqueOrThrow({
          where: { id: item.productId },
          include: { comboItems: { include: { product: true } } },
        });
        if (product.isCombo) {
          for (const line of product.comboItems) {
            if (line.product) need(line.product.id, productLabel(line.product), line.quantity * item.quantity, product.name);
          }
        } else {
          need(product.id, productLabel(product), item.quantity);
        }
        lineItems.push({
          productId: product.id,
          description: productLabel(product),
          quantity: item.quantity,
          unitPrice: product.sellPrice,
          lineTotal: product.sellPrice.times(item.quantity),
        });
      }

      for (const [productId, { name, quantity, forCombos }] of needed) {
        const decremented = await tx.finishedProduct.updateMany({
          where: { id: productId, stockQty: { gte: quantity } },
          data: { stockQty: { decrement: quantity } },
        });
        if (decremented.count === 0) {
          const usedIn = forCombos.size ? ` (needed for ${[...forCombos].join(", ")})` : "";
          throw new UserError(`Not enough stock for ${name}${usedIn}`);
        }
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
          stockDeductions: {
            create: [...needed].map(([productId, { quantity }]) => ({ productId, quantity })),
          },
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
  });
}

export async function confirmOrder(id: string) {
  const session = await requireSession();
  await requireSection(session, "orders");
  await prisma.order.update({ where: { id }, data: { status: "CONFIRMED" } });
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${id}`);
}

export async function fulfillOrder(id: string) {
  const session = await requireSession();
  await requireSection(session, "orders");
  await prisma.order.update({ where: { id }, data: { status: "FULFILLED" } });
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${id}`);
}

export async function cancelOrder(id: string) {
  const session = await requireSession();
  await requireSection(session, "orders");

  return runAction(async () => {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUniqueOrThrow({
        where: { id },
        include: { stockDeductions: true, invoice: true },
      });
      if (order.status === "CANCELLED") return;
      if (order.invoice) {
        throw new UserError("Cannot cancel an order that already has an invoice");
      }

      // Flip status first, guarded, so a double-submit can't put the stock back twice.
      const { count } = await tx.order.updateMany({
        where: { id, status: { not: "CANCELLED" } },
        data: { status: "CANCELLED" },
      });
      if (count === 0) return;

      for (const deduction of order.stockDeductions) {
        await tx.finishedProduct.update({
          where: { id: deduction.productId },
          data: { stockQty: { increment: deduction.quantity } },
        });
      }
    });

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${id}`);
    return null;
  });
}
