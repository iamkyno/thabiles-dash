import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireSession, requireSection } from "@/lib/session";
import { comboCanMake } from "@/lib/combos";
import { productLabel } from "@/lib/product-label";
import { OrderForm } from "../../order-form";

const deliveryStatusText: Record<string, string> = {
  IN_TRANSIT: "in transit",
  DELIVERED: "delivered",
  FAILED: "marked as failed",
};

export default async function EditOrderPage({ params }: PageProps<"/dashboard/orders/[id]/edit">) {
  const session = await requireSession();
  await requireSection(session, "orders");
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, stockDeductions: true, delivery: true, invoice: true },
  });
  if (!order) notFound();
  if (order.status === "CANCELLED" || order.invoice) redirect(`/dashboard/orders/${id}`);

  const productIdsOnOrder = order.items.map((i) => i.productId);
  const [customers, products] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.finishedProduct.findMany({
      where: { OR: [{ isActive: true }, { id: { in: productIdsOnOrder } }] },
      orderBy: [{ name: "asc" }, { unitSize: "asc" }],
      include: { comboItems: { include: { product: true } } },
    }),
  ]);

  // Stock this order already holds is available to it, and lines already on it keep their price.
  const held = new Map<string, number>();
  for (const d of order.stockDeductions) held.set(d.productId, (held.get(d.productId) ?? 0) + d.quantity);
  const withHeld = <T extends { id: string; stockQty: number }>(p: T) => ({ ...p, stockQty: p.stockQty + (held.get(p.id) ?? 0) });
  const orderPrices = new Map(order.items.map((i) => [i.productId, Number(i.unitPrice)]));

  const options = products.map((p) => ({
    id: p.id,
    name: productLabel(p),
    sellPrice: orderPrices.get(p.id) ?? Number(p.sellPrice),
    stockQty: p.isCombo
      ? comboCanMake(p.comboItems.map((l) => ({ ...l, product: l.product && withHeld(l.product) })))
      : withHeld(p).stockQty,
  }));

  const taxRatePercent = order.subtotal.isZero()
    ? 0
    : Number(order.taxTotal.dividedBy(order.subtotal).times(100).toDecimalPlaces(2));
  const delivery = order.delivery;
  const deliveryLockedReason =
    delivery && delivery.status !== "PENDING"
      ? `The delivery is already ${deliveryStatusText[delivery.status] ?? "under way"}, so change it from the delivery page.`
      : null;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href={`/dashboard/orders/${id}`}>
            <ArrowLeft /> Back to order
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Edit order #{order.orderSeq}</h1>
        <p className="text-muted-foreground">
          Stock is updated when you save: anything removed goes back into stock.
        </p>
      </div>
      <OrderForm
        customers={customers.map((c) => ({ id: c.id, label: c.name, address: c.address ?? undefined }))}
        products={options}
        edit={{
          orderId: order.id,
          orderSeq: order.orderSeq,
          deliveryLockedReason,
          values: {
            customerId: order.customerId,
            items: order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
            discountTotal: Number(order.discountTotal),
            taxRatePercent,
            needsDelivery: Boolean(delivery),
            deliveryAddress: delivery?.address ?? "",
          },
        }}
      />
    </div>
  );
}
