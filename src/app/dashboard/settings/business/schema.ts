import { z } from "zod";

export const businessProfileSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  currencyCode: z.string().min(1),
  timezone: z.string().min(1),
  invoicePrefix: z.string().min(1),
});
