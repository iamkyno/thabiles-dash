import { z } from "zod";

export const businessProfileSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.literal(""), z.email("Enter a valid email")]).optional(),
  taxNumber: z.string().optional(),
  paymentDetails: z.string().optional(),
  currencyCode: z.string().min(1),
  timezone: z.string().min(1),
  invoicePrefix: z.string().min(1),
});
