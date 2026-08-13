import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDate } from "@/lib/tz";

export default async function SupplierDetailPage({ params }: PageProps<"/dashboard/suppliers/[id]">) {
  await requireSession();
  const { id } = await params;

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      materials: { orderBy: { name: "asc" } },
      purchaseOrders: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!supplier) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/dashboard/suppliers">
            <ArrowLeft /> Back to suppliers
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">{supplier.name}</h1>
        <p className="text-muted-foreground">
          {supplier.contactName || "No contact"} · {supplier.phone || "No phone"} · {supplier.email || "No email"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Materials supplied</CardTitle>
        </CardHeader>
        <CardContent>
          {supplier.materials.length === 0 ? (
            <p className="text-sm text-muted-foreground">No materials linked yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Cost/unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplier.materials.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.name}</TableCell>
                    <TableCell className="text-right">
                      {m.stockQty.toString()} {m.unit}
                    </TableCell>
                    <TableCell className="text-right">{formatMoney(m.costPerUnit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Purchase orders</CardTitle>
        </CardHeader>
        <CardContent>
          {supplier.purchaseOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No purchase orders yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplier.purchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell>
                      <Link href={`/dashboard/purchase-orders/${po.id}`} className="hover:underline">
                        PO-{po.poSeq}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(po.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{po.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatMoney(po.total)}</TableCell>
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
