import { z } from "zod";

export const orderSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  items: z
    .array(z.object({ productId: z.string().min(1, "Select a product"), quantity: z.number().int().positive() }))
    .min(1, "Add at least one product"),
  discountTotal: z.number().min(0),
  taxRatePercent: z.number().min(0).max(100),
  needsDelivery: z.boolean(),
  deliveryAddress: z.string().optional(),
});

export type OrderFormValues = z.infer<typeof orderSchema>;

export const orderStatusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "success" | "warning" | "outline"
> = {
  PENDING: "outline",
  CONFIRMED: "secondary",
  FULFILLED: "success",
  CANCELLED: "destructive",
};
