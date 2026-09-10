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
import { requireSession, requireSection } from "@/lib/session";
import { formatDateTime } from "@/lib/tz";
import { formatMoney } from "@/lib/money";
import { batchStatusVariants } from "./schema";

export default async function ProductionPage() {
  const session = await requireSession();
  await requireSection(session, "production");
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
                  <TableHead className="hidden sm:table-cell">Created</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Planned</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Actual</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Cost</TableHead>
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
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDateTime(batch.createdAt)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{batch.plannedQty}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{batch.actualQty ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={batchStatusVariants[batch.status]}>{batch.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="hidden text-right sm:table-cell">
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
