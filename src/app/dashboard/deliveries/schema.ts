export const deliveryStatusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "success" | "warning" | "outline"
> = {
  PENDING: "outline",
  IN_TRANSIT: "warning",
  DELIVERED: "success",
  FAILED: "destructive",
};
