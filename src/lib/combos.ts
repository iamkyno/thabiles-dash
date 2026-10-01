import { productLabel } from "@/lib/product-label";

type ComboLine = {
  quantity: number;
  description: string | null;
  product: { name: string; unitSize: string | null; stockQty: number } | null;
};

/** How many of a combo current stock can make: limited by its scarcest product. Text-only lines don't limit it. */
export function comboCanMake(lines: ComboLine[]) {
  const limits = lines.flatMap((l) => (l.product ? [Math.floor(l.product.stockQty / l.quantity)] : []));
  return limits.length ? Math.min(...limits) : 0;
}

export function describeComboLine(line: ComboLine) {
  return `${line.quantity} × ${line.product ? productLabel(line.product) : line.description}`;
}
