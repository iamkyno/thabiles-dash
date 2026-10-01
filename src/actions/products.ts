"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSession, requireSection } from "@/lib/session";
import { runAction, UserError } from "@/lib/action-result";
import { comboSchema, type ComboFormValues } from "@/app/dashboard/products/schema";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  unitSize: z.string().optional(),
  sellPrice: z.coerce.number().min(0),
  stockQty: z.coerce.number().int().min(0),
  reorderLevel: z.coerce.number().int().min(0),
  isActive: z.boolean(),
});

export type ProductInput = z.infer<typeof productSchema>;

export async function createProduct(input: ProductInput) {
  const session = await requireSession();
  await requireSection(session, "products");
  const data = productSchema.parse(input);
  const product = await prisma.finishedProduct.create({ data });
  revalidatePath("/dashboard/products");
  return { id: product.id };
}

export async function updateProduct(id: string, input: ProductInput) {
  const session = await requireSession();
  await requireSection(session, "products");
  const data = productSchema.parse(input);
  await prisma.finishedProduct.update({ where: { id }, data });
  revalidatePath("/dashboard/products");
}

export async function deactivateProduct(id: string) {
  const session = await requireSession();
  await requireSection(session, "products");
  await prisma.finishedProduct.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/dashboard/products");
}

function comboLines(data: ComboFormValues) {
  return [
    ...data.products.map((p, i) => ({ productId: p.productId, quantity: p.quantity, position: i })),
    ...data.extras.map((e, i) => ({
      description: e.description,
      quantity: e.quantity,
      position: data.products.length + i,
    })),
  ];
}

async function saveCombo(id: string | null, data: ComboFormValues) {
  const productIds = data.products.map((p) => p.productId);
  const components = await prisma.finishedProduct.findMany({
    where: { id: { in: productIds } },
    select: { isCombo: true },
  });
  if (components.length !== productIds.length || components.some((c) => c.isCombo)) {
    throw new UserError("A combo can only contain regular products");
  }

  const fields = { name: data.name, sellPrice: data.sellPrice, isActive: data.isActive };
  if (id) {
    await prisma.$transaction([
      prisma.comboItem.deleteMany({ where: { comboId: id } }),
      prisma.finishedProduct.update({
        where: { id, isCombo: true },
        data: { ...fields, comboItems: { create: comboLines(data) } },
      }),
    ]);
  } else {
    await prisma.finishedProduct.create({
      data: { ...fields, isCombo: true, comboItems: { create: comboLines(data) } },
    });
  }

  revalidatePath("/dashboard/products");
  return null;
}

export async function createCombo(input: ComboFormValues) {
  const session = await requireSession();
  await requireSection(session, "products");
  const data = comboSchema.parse(input);
  return runAction(() => saveCombo(null, data));
}

export async function updateCombo(id: string, input: ComboFormValues) {
  const session = await requireSession();
  await requireSection(session, "products");
  const data = comboSchema.parse(input);
  return runAction(() => saveCombo(id, data));
}
