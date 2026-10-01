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

const deliveryStatusText: Record<string, string> = {
  IN_TRANSIT: "in transit",
  DELIVERED: "delivered",
  FAILED: "marked as failed",
};

/**
 * Prices the order's lines and takes what they need out of stock (combos via their products),
 * failing without changing anything if stock is short. Products in `keepPrices` keep that unit
 * price, so editing an order doesn't reprice lines that were already on it.
 */
async function priceAndTakeStock(
  tx: Prisma.TransactionClient,
  items: OrderInput["items"],
  keepPrices: Map<string, Prisma.Decimal> = new Map()
) {
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

  for (const item of items) {
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
    const unitPrice = keepPrices.get(product.id) ?? product.sellPrice;
    lineItems.push({
      productId: product.id,
      description: productLabel(product),
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice.times(item.quantity),
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
  return {
    lineItems,
    deductions: [...needed].map(([productId, { quantity }]) => ({ productId, quantity })),
    subtotal,
  };
}

function orderTotals(subtotal: Prisma.Decimal, data: OrderInput) {
  const taxTotal = subtotal.times(data.taxRatePercent).dividedBy(100);
  const discountTotal = new Prisma.Decimal(data.discountTotal);
  return { subtotal, taxTotal, discountTotal, total: subtotal.plus(taxTotal).minus(discountTotal) };
}

function deliveryAddress(data: OrderInput) {
  const address = data.deliveryAddress?.trim() ?? "";
  if (data.needsDelivery && !address) throw new UserError("Enter a delivery address");
  return address;
}

export async function createOrder(input: OrderInput) {
  const session = await requireSession();
  await requireSection(session, "orders");
  const data = orderSchema.parse(input);

  return runAction(async () => {
    const address = deliveryAddress(data);

    const order = await prisma.$transaction(async (tx) => {
      const { lineItems, deductions, subtotal } = await priceAndTakeStock(tx, data.items);

      const createdOrder = await tx.order.create({
        data: {
          customerId: data.customerId,
          createdById: session.user.id,
          status: "PENDING",
          ...orderTotals(subtotal, data),
          items: { create: lineItems },
          stockDeductions: { create: deductions },
        },
      });

      if (data.needsDelivery) {
        await tx.delivery.create({
          data: { orderId: createdOrder.id, customerId: data.customerId, address, status: "PENDING" },
        });
      }

      return createdOrder;
    });

    revalidatePath("/dashboard/orders");
    return { id: order.id };
  });
}

export async function updateOrder(id: string, input: OrderInput) {
  const session = await requireSession();
  await requireSection(session, "orders");
  const data = orderSchema.parse(input);

  return runAction(async () => {
    const address = deliveryAddress(data);

    await prisma.$transaction(async (tx) => {
      // Lock the order row first, so a cancel or another edit can't interleave with the stock moves below.
      const locked = await tx.order.updateMany({
        where: { id, status: { not: "CANCELLED" }, invoice: { is: null } },
        data: { updatedAt: new Date() },
      });
      if (locked.count === 0) {
        const current = await tx.order.findUnique({ where: { id }, include: { invoice: true } });
        if (!current) throw new UserError("This order no longer exists");
        if (current.invoice) throw new UserError("This order has an invoice, so it can't be edited");
        throw new UserError("Cancelled orders can't be edited");
      }

      const order = await tx.order.findUniqueOrThrow({
        where: { id },
        include: { items: true, stockDeductions: true, delivery: true },
      });

      const delivery = order.delivery;
      if (delivery && delivery.status !== "PENDING" && (!data.needsDelivery || address !== delivery.address)) {
        throw new UserError(
          `The delivery is already ${deliveryStatusText[delivery.status] ?? "under way"}, so change it from the delivery page`
        );
      }

      // Put back what the order holds now, then take what the edited order needs.
      for (const deduction of order.stockDeductions) {
        await tx.finishedProduct.update({
          where: { id: deduction.productId },
          data: { stockQty: { increment: deduction.quantity } },
        });
      }
      await tx.orderStockDeduction.deleteMany({ where: { orderId: id } });
      await tx.orderItem.deleteMany({ where: { orderId: id } });

      const keepPrices = new Map(order.items.map((i) => [i.productId, i.unitPrice]));
      const { lineItems, deductions, subtotal } = await priceAndTakeStock(tx, data.items, keepPrices);

      await tx.order.update({
        where: { id },
        data: {
          customerId: data.customerId,
          ...orderTotals(subtotal, data),
          items: { create: lineItems },
          stockDeductions: { create: deductions },
        },
      });

      if (delivery && data.needsDelivery) {
        await tx.delivery.update({ where: { id: delivery.id }, data: { address, customerId: data.customerId } });
      } else if (delivery) {
        await tx.delivery.delete({ where: { id: delivery.id } });
      } else if (data.needsDelivery) {
        await tx.delivery.create({ data: { orderId: id, customerId: data.customerId, address, status: "PENDING" } });
      }
    });

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${id}`);
    revalidatePath("/dashboard/deliveries");
    return null;
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
      // Flip status first (this also locks the row), so a double-submit or a concurrent edit
      // can't put the stock back twice or restore an out-of-date amount.
      const { count } = await tx.order.updateMany({
        where: { id, status: { not: "CANCELLED" }, invoice: { is: null } },
        data: { status: "CANCELLED" },
      });
      if (count === 0) {
        const order = await tx.order.findUniqueOrThrow({ where: { id }, include: { invoice: true } });
        if (order.status === "CANCELLED") return;
        throw new UserError("Cannot cancel an order that already has an invoice");
      }

      const deductions = await tx.orderStockDeduction.findMany({ where: { orderId: id } });
      for (const deduction of deductions) {
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
