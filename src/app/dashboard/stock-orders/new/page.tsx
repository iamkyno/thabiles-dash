import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireSession, requireSection } from "@/lib/session";
import { StockOrderForm } from "../stock-order-form";

export default async function NewStockOrderPage() {
  const session = await requireSession();
  await requireSection(session, "stock-orders");

  const [products, lastCosts] = await Promise.all([
    prisma.finishedProduct.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.stockOrderItem.findMany({
      distinct: ["productId"],
      orderBy: { stockOrder: { createdAt: "desc" } },
      select: { productId: true, unitCost: true },
    }),
  ]);
  const lastCostByProduct = new Map(lastCosts.map((c) => [c.productId, Number(c.unitCost)]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New stock order</h1>
        <p className="text-muted-foreground">
          Order more of your products. Their stock goes up when you mark the order as received.
        </p>
      </div>
      {products.length === 0 ? (
        <Card className="max-w-2xl">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            You don&apos;t have any active products yet.{" "}
            <Link href="/dashboard/products" className="underline">
              Add a product
            </Link>{" "}
            first.
          </CardContent>
        </Card>
      ) : (
        <StockOrderForm
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            stockQty: p.stockQty,
            lastUnitCost: lastCostByProduct.get(p.id) ?? null,
          }))}
        />
      )}
    </div>
  );
}
