import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { RecipeForm } from "../recipe-form";

export default async function RecipeEditorPage({ params }: PageProps<"/dashboard/recipes/[productId]">) {
  await requireSession();
  const { productId } = await params;

  const [product, materials] = await Promise.all([
    prisma.finishedProduct.findUnique({
      where: { id: productId },
      include: { recipe: { include: { items: true } } },
    }),
    prisma.material.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/dashboard/recipes">
            <ArrowLeft /> Back to recipes
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <p className="text-muted-foreground">{product.recipe ? "Edit" : "Set up"} the bill of materials.</p>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Recipe</CardTitle>
        </CardHeader>
        <CardContent>
          <RecipeForm
            productId={product.id}
            materials={materials.map((m) => ({ id: m.id, name: m.name, unit: m.unit }))}
            defaultValues={{
              yieldQuantity: product.recipe?.yieldQuantity ?? 1,
              instructions: product.recipe?.instructions ?? "",
              items: product.recipe?.items.map((i) => ({
                materialId: i.materialId,
                quantityPerBatch: Number(i.quantityPerBatch),
              })) ?? [{ materialId: "", quantityPerBatch: 1 }],
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
