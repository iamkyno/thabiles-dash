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

export default async function RecipesPage() {
  await requireSession();
  const products = await prisma.finishedProduct.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { recipe: { include: { items: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Recipes</h1>
        <p className="text-muted-foreground">The bill of materials for each product.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>{products.length} active products</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No products yet. Add a product first, then build its recipe here.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Yield</TableHead>
                  <TableHead>Ingredients</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.recipe ? `${product.recipe.yieldQuantity} units/batch` : "—"}
                    </TableCell>
                    <TableCell>
                      {product.recipe ? (
                        <Badge variant="secondary">{product.recipe.items.length} ingredients</Badge>
                      ) : (
                        <Badge variant="outline">No recipe</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/recipes/${product.id}`} className="text-sm hover:underline">
                        {product.recipe ? "Edit recipe" : "Set up recipe"}
                      </Link>
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
