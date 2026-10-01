import { z } from "zod";

export const stockOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Select a product"),
        quantity: z.number().int("Whole units only").positive("Quantity must be at least 1"),
        unitCost: z.number().min(0, "Cost can't be negative"),
      })
    )
    .min(1, "Add at least one product"),
});

export type StockOrderFormValues = z.infer<typeof stockOrderSchema>;

export const stockOrderStatusLabels: Record<string, string> = {
  ORDERED: "Ordered",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

export const stockOrderStatusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "success" | "warning" | "outline"
> = {
  ORDERED: "warning",
  RECEIVED: "success",
  CANCELLED: "destructive",
};
