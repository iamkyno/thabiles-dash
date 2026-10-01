export const APP_SECTIONS = [
  { key: "products", label: "Products" },
  { key: "stock-orders", label: "Stock orders" },
  { key: "customers", label: "Customers" },
  { key: "orders", label: "Orders" },
  { key: "deliveries", label: "Deliveries" },
  { key: "invoices", label: "Invoices" },
  { key: "reports", label: "Reports" },
] as const;

const SECTION_KEY_SET = new Set(APP_SECTIONS.map((s) => s.key));

export function sanitizeSections(keys: string[]): string[] {
  return keys.filter((key) => SECTION_KEY_SET.has(key as never));
}
