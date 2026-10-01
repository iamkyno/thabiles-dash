import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { requireSession, requireSection } from "@/lib/session";
import { formatMoney } from "@/lib/money";
import { comboCanMake, describeComboLine } from "@/lib/combos";
import { ProductFormDialog } from "./product-form-dialog";
import { ComboFormDialog } from "./combo-form-dialog";
import { DeactivateProductButton } from "./deactivate-product-button";

export default async function ProductsPage() {
  const session = await requireSession();
  await requireSection(session, "products");
  const all = await prisma.finishedProduct.findMany({
    orderBy: { name: "asc" },
    include: { comboItems: { orderBy: { position: "asc" }, include: { product: true } } },
  });
  const products = all.filter((p) => !p.isCombo);
  const combos = all.filter((p) => p.isCombo);
  const activeProductOptions = products.filter((p) => p.isActive).map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-muted-foreground">Finished goods and combos you sell to customers.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ComboFormDialog productOptions={activeProductOptions} />
          <ProductFormDialog />
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All products</CardTitle>
          <CardDescription>{products.length} products</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No products yet. Add your first product to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden text-right whitespace-nowrap sm:table-cell">Price</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Stock</TableHead>
                  <TableHead className="w-px" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} className={!product.isActive ? "opacity-50" : undefined}>
                    <TableCell className="hidden font-mono text-xs sm:table-cell">{product.sku}</TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                      {product.unitSize && <span className="text-muted-foreground"> ({product.unitSize})</span>}
                      {!product.isActive && (
                        <Badge variant="outline" className="ml-2">
                          Inactive
                        </Badge>
                      )}
                      <div className="text-xs font-normal text-muted-foreground sm:hidden">
                        {formatMoney(product.sellPrice)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-right whitespace-nowrap sm:table-cell">
                      {formatMoney(product.sellPrice)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {product.stockQty <= product.reorderLevel ? (
                        <Badge variant="warning">{product.stockQty}</Badge>
                      ) : (
                        product.stockQty
                      )}
                    </TableCell>
                    <TableCell className="w-px whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <ProductFormDialog
                          mode="edit"
                          productId={product.id}
                          defaultValues={{
                            sku: product.sku,
                            name: product.name,
                            description: product.description ?? "",
                            unitSize: product.unitSize ?? "",
                            sellPrice: Number(product.sellPrice),
                            stockQty: product.stockQty,
                            reorderLevel: product.reorderLevel,
                            isActive: product.isActive,
                          }}
                        />
                        {product.isActive && <DeactivateProductButton productId={product.id} />}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Combos</CardTitle>
          <CardDescription>
            Selling a combo takes its products out of stock. &ldquo;Can make&rdquo; is how many current stock allows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {combos.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No combos yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Combo</TableHead>
                  <TableHead className="hidden text-right whitespace-nowrap sm:table-cell">Price</TableHead>
                  <TableHead className="hidden text-right whitespace-nowrap sm:table-cell">Can make</TableHead>
                  <TableHead className="w-px" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {combos.map((combo) => {
                  const canMake = comboCanMake(combo.comboItems);
                  const lineIds = new Set(combo.comboItems.map((l) => l.productId));
                  return (
                    <TableRow key={combo.id} className={!combo.isActive ? "opacity-50" : undefined}>
                      <TableCell>
                        <div className="font-medium">
                          {combo.name}
                          {!combo.isActive && (
                            <Badge variant="outline" className="ml-2">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm sm:hidden">
                          <span>{formatMoney(combo.sellPrice)}</span>
                          <span className="text-muted-foreground">·</span>
                          <span>
                            Can make {canMake === 0 ? <Badge variant="warning">0</Badge> : canMake}
                          </span>
                        </div>
                        <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                          {combo.comboItems.map((line) => (
                            <li key={line.id}>
                              {describeComboLine(line)}
                              {line.product && line.product.stockQty < line.quantity && (
                                <span className="text-destructive"> — {line.product.stockQty} in stock</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell className="hidden text-right align-top whitespace-nowrap sm:table-cell">
                        {formatMoney(combo.sellPrice)}
                      </TableCell>
                      <TableCell className="hidden text-right align-top whitespace-nowrap sm:table-cell">
                        {canMake === 0 ? <Badge variant="warning">0</Badge> : canMake}
                      </TableCell>
                      <TableCell className="w-px align-top whitespace-nowrap">
                        <div className="flex justify-end gap-1">
                          <ComboFormDialog
                            comboId={combo.id}
                            productOptions={products
                              .filter((p) => p.isActive || lineIds.has(p.id))
                              .map((p) => ({ id: p.id, name: p.name }))}
                            defaultValues={{
                              name: combo.name,
                              sku: combo.sku,
                              sellPrice: Number(combo.sellPrice),
                              isActive: combo.isActive,
                              products: combo.comboItems.flatMap((l) =>
                                l.productId ? [{ productId: l.productId, quantity: l.quantity }] : []
                              ),
                              extras: combo.comboItems.flatMap((l) =>
                                l.productId ? [] : [{ description: l.description ?? "", quantity: l.quantity }]
                              ),
                            }}
                          />
                          {combo.isActive && <DeactivateProductButton productId={combo.id} />}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
