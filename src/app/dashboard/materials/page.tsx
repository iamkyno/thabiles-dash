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
import { MaterialFormDialog } from "./material-form-dialog";
import { DeactivateMaterialButton } from "./deactivate-material-button";
import { materialTypeLabels, unitLabels } from "./schema";

export default async function MaterialsPage() {
  await requireSession();
  const [materials, suppliers] = await Promise.all([
    prisma.material.findMany({ orderBy: { name: "asc" }, include: { primarySupplier: true } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Materials</h1>
          <p className="text-muted-foreground">Raw ingredients and packaging inventory.</p>
        </div>
        <MaterialFormDialog suppliers={suppliers} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All materials</CardTitle>
          <CardDescription>{materials.length} materials</CardDescription>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No materials yet. Add your first material to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Cost/unit</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((m) => {
                  const stockQty = Number(m.stockQty);
                  const reorderLevel = Number(m.reorderLevel);
                  const low = stockQty <= reorderLevel;
                  return (
                    <TableRow key={m.id} className={!m.isActive ? "opacity-50" : undefined}>
                      <TableCell className="font-mono text-xs">{m.sku}</TableCell>
                      <TableCell className="font-medium">
                        {m.name}
                        {!m.isActive && (
                          <Badge variant="outline" className="ml-2">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{materialTypeLabels[m.type]}</TableCell>
                      <TableCell className="text-muted-foreground">{m.primarySupplier?.name || "—"}</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(m.costPerUnit)}/{unitLabels[m.unit]}
                      </TableCell>
                      <TableCell className="text-right">
                        {low ? (
                          <Badge variant="warning">
                            {stockQty} {unitLabels[m.unit]}
                          </Badge>
                        ) : (
                          `${stockQty} ${unitLabels[m.unit]}`
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <MaterialFormDialog
                            mode="edit"
                            materialId={m.id}
                            suppliers={suppliers}
                            defaultValues={{
                              sku: m.sku,
                              name: m.name,
                              type: m.type,
                              unit: m.unit,
                              costPerUnit: Number(m.costPerUnit),
                              stockQty: Number(m.stockQty),
                              reorderLevel: Number(m.reorderLevel),
                              primarySupplierId: m.primarySupplierId ?? "",
                              isActive: m.isActive,
                            }}
                          />
                          {m.isActive && <DeactivateMaterialButton materialId={m.id} />}
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
