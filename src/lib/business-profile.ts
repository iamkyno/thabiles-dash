import "server-only";

import { prisma } from "@/lib/prisma";

// Read-only: unlike getBusinessProfile() this never creates the row, so it's safe on public pages.
export async function readBusinessProfile() {
  const profile = await prisma.businessProfile.findUnique({ where: { id: 1 } });
  return {
    businessName: profile?.businessName || "TSC-Thabiles Skin Care",
    address: profile?.address || null,
    phone: profile?.phone || null,
    email: profile?.email || null,
    taxNumber: profile?.taxNumber || null,
    paymentDetails: profile?.paymentDetails || null,
    invoicePrefix: profile?.invoicePrefix || "INV",
  };
}

export type InvoiceBusiness = Awaited<ReturnType<typeof readBusinessProfile>>;
