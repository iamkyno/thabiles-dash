import { z } from "zod";

export const materialTypes = ["RAW_INGREDIENT", "PACKAGING"] as const;
export const materialTypeLabels: Record<(typeof materialTypes)[number], string> = {
  RAW_INGREDIENT: "Raw ingredient",
  PACKAGING: "Packaging",
};

export const units = ["MG", "G", "KG", "ML", "L", "PIECE"] as const;
export const unitLabels: Record<(typeof units)[number], string> = {
  MG: "mg",
  G: "g",
  KG: "kg",
  ML: "ml",
  L: "L",
  PIECE: "piece",
};

export const materialSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  type: z.enum(materialTypes),
  unit: z.enum(units),
  costPerUnit: z.number().min(0),
  stockQty: z.number().min(0),
  reorderLevel: z.number().min(0),
  primarySupplierId: z.string().optional(),
  isActive: z.boolean(),
});

export type MaterialFormValues = z.infer<typeof materialSchema>;
