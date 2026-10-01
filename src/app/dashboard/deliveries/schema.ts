import { z } from "zod";

export const deliveryStatusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "success" | "warning" | "outline"
> = {
  PENDING: "outline",
  IN_TRANSIT: "warning",
  DELIVERED: "success",
  FAILED: "destructive",
};

export const deliveryDetailsSchema = z.object({
  address: z.string().trim().min(1, "Enter the delivery address"),
  courierName: z.string(),
  trackingRef: z.string(),
  notes: z.string(),
});

export type DeliveryDetailsValues = z.infer<typeof deliveryDetailsSchema>;
