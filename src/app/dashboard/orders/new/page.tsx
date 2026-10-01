import { prisma } from "@/lib/prisma";
import { requireSession, requireSection } from "@/lib/session";
import { comboCanMake } from "@/lib/combos";
import { OrderForm } from "../order-form";

export default async function NewOrderPage() {
  const session = await requireSession();
  await requireSection(session, "orders");

  const [customers, products] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.finishedProduct.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: { comboItems: { include: { product: true } } },
    }),
  ]);
  const sellable = products
    .map((p) => ({ ...p, available: p.isCombo ? comboCanMake(p.comboItems) : p.stockQty }))
    .filter((p) => p.available > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New order</h1>
        <p className="text-muted-foreground">Sell finished products to a customer.</p>
      </div>
      <OrderForm
        customers={customers.map((c) => ({ id: c.id, label: c.name, address: c.address ?? undefined }))}
        products={sellable.map((p) => ({
          id: p.id,
          name: p.name,
          sellPrice: Number(p.sellPrice),
          stockQty: p.available,
        }))}
      />
    </div>
  );
}
