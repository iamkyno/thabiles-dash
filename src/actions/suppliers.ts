"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type SupplierInput = z.infer<typeof supplierSchema>;

export async function createSupplier(input: SupplierInput) {
  await requireSession();
  const data = supplierSchema.parse(input);
  const supplier = await prisma.supplier.create({ data: { ...data, email: data.email || undefined } });
  revalidatePath("/dashboard/suppliers");
  return { id: supplier.id };
}

export async function updateSupplier(id: string, input: SupplierInput) {
  await requireSession();
  const data = supplierSchema.parse(input);
  await prisma.supplier.update({ where: { id }, data: { ...data, email: data.email || undefined } });
  revalidatePath("/dashboard/suppliers");
  revalidatePath(`/dashboard/suppliers/${id}`);
}

export async function deleteSupplier(id: string) {
  await requireSession();
  await prisma.supplier.delete({ where: { id } });
  revalidatePath("/dashboard/suppliers");
}
