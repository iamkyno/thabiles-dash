import Link from "next/link";

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
import { SupplierFormDialog } from "./supplier-form-dialog";
import { DeleteSupplierButton } from "./delete-supplier-button";

export default async function SuppliersPage() {
  const session = await requireSession();
  await requireSection(session, "suppliers");
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { materials: true, purchaseOrders: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Suppliers</h1>
          <p className="text-muted-foreground">Where ingredients and packaging come from.</p>
        </div>
        <SupplierFormDialog />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All suppliers</CardTitle>
          <CardDescription>{suppliers.length} suppliers</CardDescription>
        </CardHeader>
        <CardContent>
          {suppliers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No suppliers yet. Add your first supplier to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Contact</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="hidden sm:table-cell">Materials</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/suppliers/${supplier.id}`} className="hover:underline">
                        {supplier.name}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{supplier.contactName || "—"}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{supplier.phone || "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell">{supplier._count.materials}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <SupplierFormDialog
                          mode="edit"
                          supplierId={supplier.id}
                          defaultValues={{
                            name: supplier.name,
                            contactName: supplier.contactName ?? "",
                            phone: supplier.phone ?? "",
                            email: supplier.email ?? "",
                            address: supplier.address ?? "",
                            notes: supplier.notes ?? "",
                          }}
                        />
                        <DeleteSupplierButton supplierId={supplier.id} />
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
