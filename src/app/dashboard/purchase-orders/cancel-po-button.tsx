"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cancelPurchaseOrder } from "@/actions/purchase-orders";
import { Button } from "@/components/ui/button";

export function CancelPOButton({ poId }: { poId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() => {
        if (!confirm("Cancel this purchase order?")) return;
        startTransition(async () => {
          try {
            await cancelPurchaseOrder(poId);
            toast.success("Purchase order cancelled");
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to cancel purchase order");
          }
        });
      }}
    >
      Cancel order
    </Button>
  );
}
