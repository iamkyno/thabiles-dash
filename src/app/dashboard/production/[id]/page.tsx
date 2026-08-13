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
import { batchStatusVariants } from "../schema";
import { StartBatchButton, CancelBatchButton, CompleteBatchDialog } from "../batch-actions";

export default async function ProductionBatchDetailPage({ params }: PageProps<"/dashboard/production/[id]">) {
  await requireSession();
  const { id } = await params;

  const batch = await prisma.productionBatch.findUnique({
    where: { id },
    include: {
      product: true,
      recipe: { include: { items: { include: { material: true } } } },
      producedBy: true,
      materialUsages: { include: { material: true } },
    },
  });

  if (!batch) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/dashboard/production">
            <ArrowLeft /> Back to production
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Batch-{batch.batchSeq}</h1>
            <p className="text-muted-foreground">
              {batch.product.name} · Created by {batch.producedBy.name} on {formatDateTime(batch.createdAt)}
            </p>
          </div>
          <Badge variant={batchStatusVariants[batch.status]}>{batch.status.replace("_", " ")}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Planned quantity: </span>
            {batch.plannedQty} units
          </p>
          {batch.actualQty !== null && (
            <p>
              <span className="text-muted-foreground">Actual quantity: </span>
              {batch.actualQty} units
            </p>
          )}
          {batch.totalCost && (
            <p>
              <span className="text-muted-foreground">Total ingredient cost: </span>
              {formatMoney(batch.totalCost)}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          {batch.status === "PLANNED" && (
            <>
              <StartBatchButton batchId={batch.id} />
              <CompleteBatchDialog batchId={batch.id} plannedQty={batch.plannedQty} />
              <CancelBatchButton batchId={batch.id} />
            </>
          )}
          {batch.status === "IN_PROGRESS" && (
            <>
              <CompleteBatchDialog batchId={batch.id} plannedQty={batch.plannedQty} />
              <CancelBatchButton batchId={batch.id} />
            </>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{batch.status === "COMPLETED" ? "Materials used" : "Recipe (per batch of " + batch.recipe.yieldQuantity + ")"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                {batch.status === "COMPLETED" && <TableHead className="text-right">Cost</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {batch.status === "COMPLETED"
                ? batch.materialUsages.map((usage) => (
                    <TableRow key={usage.id}>
                      <TableCell>{usage.material.name}</TableCell>
                      <TableCell className="text-right">
                        {usage.quantityUsed.toString()} {usage.material.unit}
                      </TableCell>
                      <TableCell className="text-right">{formatMoney(usage.lineCost)}</TableCell>
                    </TableRow>
                  ))
                : batch.recipe.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.material.name}</TableCell>
                      <TableCell className="text-right">
                        {item.quantityPerBatch.toString()} {item.material.unit}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
