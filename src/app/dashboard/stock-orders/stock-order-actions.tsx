"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, PackageCheck } from "lucide-react";

import { cancelStockOrder, receiveStockOrder } from "@/actions/stock-orders";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";

export function StockOrderActions({ stockOrderId }: { stockOrderId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<ActionResult>, success: string) {
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(success);
        router.refresh();
      } catch {
        toast.error("Something went wrong");
      }
    });
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      <Button
        disabled={pending}
        onClick={() => run(() => receiveStockOrder(stockOrderId), "Stock received — product quantities updated")}
      >
        {pending ? <Loader2 className="animate-spin" /> : <PackageCheck />}
        Mark as received
      </Button>
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => {
          if (!confirm("Cancel this stock order?")) return;
          run(() => cancelStockOrder(stockOrderId), "Stock order cancelled");
        }}
      >
        Cancel order
      </Button>
    </div>
  );
}
