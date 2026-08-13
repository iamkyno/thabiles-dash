import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { POForm } from "../po-form";

export default async function NewPurchaseOrderPage() {
  await requireSession();

  const [suppliers, materials] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.material.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New purchase order</h1>
        <p className="text-muted-foreground">Order ingredients or packaging from a supplier.</p>
      </div>
      <POForm
        suppliers={suppliers.map((s) => ({ id: s.id, label: s.name }))}
        materials={materials.map((m) => ({
          id: m.id,
          name: m.name,
          unit: m.unit,
          costPerUnit: Number(m.costPerUnit),
        }))}
      />
    </div>
  );
}
