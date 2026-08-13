"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const recipeSchema = z.object({
  yieldQuantity: z.number().int().positive("Yield must be at least 1"),
  instructions: z.string().optional(),
  items: z
    .array(
      z.object({
        materialId: z.string().min(1, "Select a material"),
        quantityPerBatch: z.number().positive("Quantity must be greater than 0"),
      })
    )
    .min(1, "Add at least one ingredient"),
});

export type RecipeInput = z.infer<typeof recipeSchema>;

export async function saveRecipe(productId: string, input: RecipeInput) {
  await requireSession();
  const data = recipeSchema.parse(input);

  await prisma.$transaction(async (tx) => {
    const recipe = await tx.recipe.upsert({
      where: { productId },
      update: { yieldQuantity: data.yieldQuantity, instructions: data.instructions },
      create: { productId, yieldQuantity: data.yieldQuantity, instructions: data.instructions },
    });
    await tx.recipeItem.deleteMany({ where: { recipeId: recipe.id } });
    await tx.recipeItem.createMany({
      data: data.items.map((i) => ({
        recipeId: recipe.id,
        materialId: i.materialId,
        quantityPerBatch: i.quantityPerBatch,
      })),
    });
  });

  revalidatePath(`/dashboard/recipes/${productId}`);
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/production/new");
}
