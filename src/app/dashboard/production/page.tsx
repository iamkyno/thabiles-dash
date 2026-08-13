import Link from "next/link";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { formatDateTime } from "@/lib/tz";
import { formatMoney } from "@/lib/money";
import { batchStatusVariants } from "./schema";

export default async function ProductionPage() {
  await requireSession();
  const batches = await prisma.productionBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: true },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Production</h1>
          <p className="text-muted-foreground">Batches turning raw materials into finished products.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/production/new">
            <Plus /> New batch
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All batches</CardTitle>
          <CardDescription>{batches.length} batches</CardDescription>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No production batches yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Planned</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/production/${batch.id}`} className="hover:underline">
                        Batch-{batch.batchSeq}
                      </Link>
                    </TableCell>
                    <TableCell>{batch.product.name}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(batch.createdAt)}</TableCell>
                    <TableCell className="text-right">{batch.plannedQty}</TableCell>
                    <TableCell className="text-right">{batch.actualQty ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={batchStatusVariants[batch.status]}>{batch.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {batch.totalCost ? formatMoney(batch.totalCost) : "—"}
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
