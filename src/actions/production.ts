"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { Prisma } from "@/generated/prisma/client";

const createSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  plannedQty: z.number().int().positive("Planned quantity must be greater than 0"),
});

export async function createProductionBatch(input: z.infer<typeof createSchema>) {
  const session = await requireSession();
  const data = createSchema.parse(input);

  const recipe = await prisma.recipe.findUnique({ where: { productId: data.productId } });
  if (!recipe) throw new Error("This product doesn't have a recipe yet");

  const batch = await prisma.productionBatch.create({
    data: {
      productId: data.productId,
      recipeId: recipe.id,
      plannedQty: data.plannedQty,
      status: "PLANNED",
      producedById: session.user.id,
    },
  });

  revalidatePath("/dashboard/production");
  return { id: batch.id };
}

export async function startProductionBatch(id: string) {
  await requireSession();
  const batch = await prisma.productionBatch.findUniqueOrThrow({ where: { id } });
  if (batch.status !== "PLANNED") throw new Error("Only planned batches can be started");
  await prisma.productionBatch.update({
    where: { id },
    data: { status: "IN_PROGRESS", startedAt: new Date() },
  });
  revalidatePath(`/dashboard/production/${id}`);
  revalidatePath("/dashboard/production");
}

export async function cancelProductionBatch(id: string) {
  await requireSession();
  const batch = await prisma.productionBatch.findUniqueOrThrow({ where: { id } });
  if (batch.status === "COMPLETED" || batch.status === "CANCELLED") {
    throw new Error("This batch can no longer be cancelled");
  }
  await prisma.productionBatch.update({ where: { id }, data: { status: "CANCELLED" } });
  revalidatePath(`/dashboard/production/${id}`);
  revalidatePath("/dashboard/production");
}

const completeSchema = z.object({ actualQty: z.number().int().positive() });

export async function completeProductionBatch(id: string, input: z.infer<typeof completeSchema>) {
  await requireSession();
  const data = completeSchema.parse(input);

  await prisma.$transaction(async (tx) => {
    const batch = await tx.productionBatch.findUniqueOrThrow({
      where: { id },
      include: { recipe: { include: { items: true } } },
    });
    if (batch.status !== "PLANNED" && batch.status !== "IN_PROGRESS") {
      throw new Error("This batch can no longer be completed");
    }

    const scale = new Prisma.Decimal(data.actualQty).dividedBy(batch.recipe.yieldQuantity);
    let totalCost = new Prisma.Decimal(0);

    for (const recipeItem of batch.recipe.items) {
      const requiredQty = recipeItem.quantityPerBatch.times(scale);
      const material = await tx.material.findUniqueOrThrow({ where: { id: recipeItem.materialId } });

      const decremented = await tx.material.updateMany({
        where: { id: recipeItem.materialId, stockQty: { gte: requiredQty } },
        data: { stockQty: { decrement: requiredQty } },
      });
      if (decremented.count === 0) {
        throw new Error(`Not enough stock of ${material.name} to complete this batch`);
      }

      const lineCost = requiredQty.times(material.costPerUnit);
      totalCost = totalCost.plus(lineCost);

      await tx.batchMaterialUsage.create({
        data: {
          batchId: id,
          materialId: material.id,
          quantityUsed: requiredQty,
          unitCostAtUsage: material.costPerUnit,
          lineCost,
        },
      });
    }

    await tx.finishedProduct.update({
      where: { id: batch.productId },
      data: { stockQty: { increment: data.actualQty } },
    });

    await tx.productionBatch.update({
      where: { id },
      data: {
        status: "COMPLETED",
        actualQty: data.actualQty,
        completedAt: new Date(),
        totalCost,
      },
    });
  });

  revalidatePath(`/dashboard/production/${id}`);
  revalidatePath("/dashboard/production");
  revalidatePath("/dashboard/materials");
  revalidatePath("/dashboard/products");
}
