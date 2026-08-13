"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, PackageCheck } from "lucide-react";

import { receivePurchaseOrder } from "@/actions/purchase-orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Item = {
  id: string;
  materialName: string;
  unit: string;
  quantityOrdered: number;
  quantityReceived: number;
};

export function ReceiveForm({ poId, items }: { poId: string; items: Item[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit } = useForm<Record<string, number>>({
    defaultValues: Object.fromEntries(
      items.map((i) => [i.id, Math.max(i.quantityOrdered - i.quantityReceived, 0)])
    ),
  });

  async function onSubmit(values: Record<string, number>) {
    setSubmitting(true);
    try {
      await receivePurchaseOrder(poId, {
        receipts: items.map((i) => ({
          itemId: i.id,
          quantityReceived: Number(values[i.id]) || 0,
        })),
      });
      toast.success("Stock received");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to receive stock");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Material</TableHead>
            <TableHead className="text-right">Ordered</TableHead>
            <TableHead className="text-right">Already received</TableHead>
            <TableHead className="text-right">Receive now</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.materialName}</TableCell>
              <TableCell className="text-right">
                {item.quantityOrdered} {item.unit}
              </TableCell>
              <TableCell className="text-right">
                {item.quantityReceived} {item.unit}
              </TableCell>
              <TableCell className="text-right">
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  className="ml-auto w-28"
                  {...register(item.id, { valueAsNumber: true })}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button type="submit" disabled={submitting}>
        {submitting ? <Loader2 className="animate-spin" /> : <PackageCheck />}
        Record receipt
      </Button>
    </form>
  );
}
