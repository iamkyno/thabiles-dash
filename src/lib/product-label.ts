/** How a product is shown anywhere it's picked or listed, e.g. "Face Cream (2kg)" — keeps 2kg and 5kg apart. */
export function productLabel(product: { name: string; unitSize: string | null }) {
  const size = product.unitSize?.trim();
  return size ? `${product.name} (${size})` : product.name;
}
