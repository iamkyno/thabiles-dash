import type { Prisma } from "@/generated/prisma/client";

type Decimalish = Prisma.Decimal | number | string | null | undefined;

export function toNumber(value: Decimalish): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

const currencySymbols: Record<string, string> = {
  ZAR: "R",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

// Deliberately uses a fixed "en-US" number format (not a currency-specific
// locale like "en-ZA") and prepends the symbol manually. Locale-specific
// currency formatting (decimal/grouping separators) is not guaranteed to
// resolve identically between the Node SSR runtime and the browser's ICU
// data, which causes React hydration mismatches for locales like en-ZA.
export function formatMoney(value: Decimalish, currencyCode = "ZAR") {
  const symbol = currencySymbols[currencyCode] ?? `${currencyCode} `;
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value));
  return `${symbol} ${formatted}`;
}
