import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  unitSize: z.string().optional(),
  sellPrice: z.number().min(0),
  stockQty: z.number().int().min(0),
  reorderLevel: z.number().int().min(0),
  isActive: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const comboSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  sellPrice: z.number().min(0),
  isActive: z.boolean(),
  products: z
    .array(
      z.object({
        productId: z.string().min(1, "Select a product"),
        quantity: z.number().int("Whole units only").positive("At least 1"),
      })
    )
    .min(1, "Add at least one product")
    .refine((lines) => new Set(lines.map((l) => l.productId)).size === lines.length, {
      message: "Each product can only be listed once — increase its quantity instead",
    }),
  extras: z.array(
    z.object({
      description: z.string().trim().min(1, "Describe the item"),
      quantity: z.number().int("Whole units only").positive("At least 1"),
    })
  ),
});

export type ComboFormValues = z.infer<typeof comboSchema>;
