import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { OrderForm } from "../order-form";

export default async function NewOrderPage() {
  await requireSession();

  const [customers, products] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.finishedProduct.findMany({ where: { isActive: true, stockQty: { gt: 0 } }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New order</h1>
        <p className="text-muted-foreground">Sell finished products to a customer.</p>
      </div>
      <OrderForm
        customers={customers.map((c) => ({ id: c.id, label: c.name, address: c.address ?? undefined }))}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          sellPrice: Number(p.sellPrice),
          stockQty: p.stockQty,
        }))}
      />
    </div>
  );
}
