"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";

const businessProfileSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  currencyCode: z.string().min(1),
  timezone: z.string().min(1),
  invoicePrefix: z.string().min(1),
});

export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;

export async function updateBusinessProfile(input: BusinessProfileInput) {
  await requireOwner();
  const data = businessProfileSchema.parse(input);

  await prisma.businessProfile.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });

  revalidatePath("/dashboard/settings/business");
}

export async function getBusinessProfile() {
  return prisma.businessProfile.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, businessName: "My Business" },
  });
}
