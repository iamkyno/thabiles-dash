import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDateTime } from "@/lib/tz";
import { poStatusVariants } from "../schema";
import { ReceiveForm } from "../receive-form";
import { CancelPOButton } from "../cancel-po-button";

export default async function PurchaseOrderDetailPage({
  params,
}: PageProps<"/dashboard/purchase-orders/[id]">) {
  await requireSession();
  const { id } = await params;

  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { supplier: true, items: { include: { material: true } }, createdBy: true },
  });

  if (!po) notFound();

  const canReceive = po.status === "ORDERED" || po.status === "PARTIALLY_RECEIVED";
  const canCancel = po.status === "DRAFT" || po.status === "ORDERED";

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/dashboard/purchase-orders">
            <ArrowLeft /> Back to purchase orders
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">PO-{po.poSeq}</h1>
            <p className="text-muted-foreground">
              {po.supplier.name} · Created by {po.createdBy.name} on {formatDateTime(po.createdAt)}
            </p>
          </div>
          <Badge variant={poStatusVariants[po.status]}>{po.status.replace("_", " ")}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Ordered</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Unit cost</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.material.name}</TableCell>
                  <TableCell className="text-right">
                    {item.quantityOrdered.toString()} {item.material.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.quantityReceived.toString()} {item.material.unit}
                  </TableCell>
                  <TableCell className="text-right">{formatMoney(item.unitCost)}</TableCell>
                  <TableCell className="text-right">{formatMoney(item.lineTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="ml-auto mt-4 max-w-xs text-sm font-semibold">
            <div className="flex justify-between">
              <span>Total</span>
              <span>{formatMoney(po.total)}</span>
            </div>
          </div>
        </CardContent>
        {canCancel && (
          <CardFooter>
            <CancelPOButton poId={po.id} />
          </CardFooter>
        )}
      </Card>

      {canReceive && (
        <Card>
          <CardHeader>
            <CardTitle>Receive stock</CardTitle>
          </CardHeader>
          <CardContent>
            <ReceiveForm
              poId={po.id}
              items={po.items.map((item) => ({
                id: item.id,
                materialName: item.material.name,
                unit: item.material.unit,
                quantityOrdered: Number(item.quantityOrdered),
                quantityReceived: Number(item.quantityReceived),
              }))}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
