import { z } from "zod";

export const productSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  unitSize: z.string().optional(),
  sellPrice: z.number().min(0),
  stockQty: z.number().int().min(0),
  reorderLevel: z.number().int().min(0),
  isActive: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
