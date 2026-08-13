import { z } from "zod";

export const poSchema = z.object({
  supplierId: z.string().min(1, "Select a supplier"),
  items: z
    .array(
      z.object({
        materialId: z.string().min(1, "Select a material"),
        quantityOrdered: z.number().positive("Quantity must be greater than 0"),
        unitCost: z.number().min(0),
      })
    )
    .min(1, "Add at least one line item"),
});

export type POFormValues = z.infer<typeof poSchema>;

export const poStatusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "success" | "warning" | "outline"
> = {
  DRAFT: "outline",
  ORDERED: "secondary",
  PARTIALLY_RECEIVED: "warning",
  RECEIVED: "success",
  CANCELLED: "destructive",
};
