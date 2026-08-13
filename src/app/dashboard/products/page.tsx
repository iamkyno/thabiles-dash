import Link from "next/link";

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
import { requireSession } from "@/lib/session";
import { formatMoney } from "@/lib/money";
import { ProductFormDialog } from "./product-form-dialog";
import { DeactivateProductButton } from "./deactivate-product-button";

export default async function ProductsPage() {
  await requireSession();
  const products = await prisma.finishedProduct.findMany({
    orderBy: { name: "asc" },
    include: { recipe: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-muted-foreground">Finished goods you sell to customers.</p>
        </div>
        <ProductFormDialog />
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
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Recipe</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} className={!product.isActive ? "opacity-50" : undefined}>
                    <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                      {product.unitSize && <span className="text-muted-foreground"> ({product.unitSize})</span>}
                      {!product.isActive && (
                        <Badge variant="outline" className="ml-2">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatMoney(product.sellPrice)}</TableCell>
                    <TableCell className="text-right">
                      {product.stockQty <= product.reorderLevel ? (
                        <Badge variant="warning">{product.stockQty}</Badge>
                      ) : (
                        product.stockQty
                      )}
                    </TableCell>
                    <TableCell>
                      {product.recipe ? (
                        <Link href={`/dashboard/recipes/${product.id}`} className="text-sm hover:underline">
                          View recipe
                        </Link>
                      ) : (
                        <Link href={`/dashboard/recipes/${product.id}`} className="text-sm text-muted-foreground hover:underline">
                          Set up recipe
                        </Link>
                      )}
                    </TableCell>
                    <TableCell>
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
    </div>
  );
}
