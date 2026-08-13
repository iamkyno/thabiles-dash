"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;

export async function createCustomer(input: CustomerInput) {
  await requireSession();
  const data = customerSchema.parse(input);
  const customer = await prisma.customer.create({ data: { ...data, email: data.email || undefined } });
  revalidatePath("/dashboard/customers");
  return { id: customer.id };
}

export async function updateCustomer(id: string, input: CustomerInput) {
  await requireSession();
  const data = customerSchema.parse(input);
  await prisma.customer.update({ where: { id }, data: { ...data, email: data.email || undefined } });
  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${id}`);
}

export async function deleteCustomer(id: string) {
  await requireSession();
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/dashboard/customers");
}
