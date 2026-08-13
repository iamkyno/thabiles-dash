export const invoiceStatusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "success" | "warning" | "outline"
> = {
  DRAFT: "outline",
  SENT: "secondary",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  OVERDUE: "destructive",
  VOID: "outline",
};

export const paymentMethods = ["CASH", "CARD", "EFT", "MOBILE_MONEY", "OTHER"] as const;
export const paymentMethodLabels: Record<(typeof paymentMethods)[number], string> = {
  CASH: "Cash",
  CARD: "Card",
  EFT: "EFT",
  MOBILE_MONEY: "Mobile money",
  OTHER: "Other",
};
