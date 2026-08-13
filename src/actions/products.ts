"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const productSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
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
  await requireSession();
  const data = productSchema.parse(input);
  const product = await prisma.finishedProduct.create({ data });
  revalidatePath("/dashboard/products");
  return { id: product.id };
}

export async function updateProduct(id: string, input: ProductInput) {
  await requireSession();
  const data = productSchema.parse(input);
  await prisma.finishedProduct.update({ where: { id }, data });
  revalidatePath("/dashboard/products");
}

export async function deactivateProduct(id: string) {
  await requireSession();
  await prisma.finishedProduct.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/dashboard/products");
}
