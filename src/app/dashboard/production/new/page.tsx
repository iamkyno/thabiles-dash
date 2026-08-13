import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { ProductionForm } from "../production-form";

export default async function NewProductionBatchPage() {
  await requireSession();

  const products = await prisma.finishedProduct.findMany({
    where: { isActive: true, recipe: { isNot: null } },
    include: { recipe: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New production batch</h1>
        <p className="text-muted-foreground">Plan a production run for a product.</p>
      </div>
      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No products have a recipe yet. Set up a recipe first from the Recipes page.
        </p>
      ) : (
        <ProductionForm
          products={products.map((p) => ({ id: p.id, name: p.name, yieldQuantity: p.recipe!.yieldQuantity }))}
        />
      )}
    </div>
  );
}
