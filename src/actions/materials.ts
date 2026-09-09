"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSession, requireSection } from "@/lib/session";

const materialSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  type: z.enum(["RAW_INGREDIENT", "PACKAGING"]),
  unit: z.enum(["MG", "G", "KG", "ML", "L", "PIECE"]),
  costPerUnit: z.coerce.number().min(0),
  stockQty: z.coerce.number().min(0),
  reorderLevel: z.coerce.number().min(0),
  primarySupplierId: z.string().optional(),
  isActive: z.boolean(),
});

export type MaterialInput = z.infer<typeof materialSchema>;

export async function createMaterial(input: MaterialInput) {
  const session = await requireSession();
  await requireSection(session, "materials");
  const data = materialSchema.parse(input);
  await prisma.material.create({
    data: { ...data, primarySupplierId: data.primarySupplierId || undefined },
  });
  revalidatePath("/dashboard/materials");
}

export async function updateMaterial(id: string, input: MaterialInput) {
  const session = await requireSession();
  await requireSection(session, "materials");
  const data = materialSchema.parse(input);
  await prisma.material.update({
    where: { id },
    data: { ...data, primarySupplierId: data.primarySupplierId || null },
  });
  revalidatePath("/dashboard/materials");
}

export async function deactivateMaterial(id: string) {
  const session = await requireSession();
  await requireSection(session, "materials");
  await prisma.material.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/dashboard/materials");
}
