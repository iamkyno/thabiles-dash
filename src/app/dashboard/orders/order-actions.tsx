"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { confirmOrder, fulfillOrder, cancelOrder } from "@/actions/orders";
import { Button } from "@/components/ui/button";

export function OrderActions({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (status === "CANCELLED" || status === "FULFILLED") return null;

  return (
    <div className="flex flex-wrap gap-2">
      {status === "PENDING" && (
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await confirmOrder(orderId);
                toast.success("Order confirmed");
                router.refresh();
              } catch {
                toast.error("Failed to confirm order");
              }
            })
          }
        >
          {pending && <Loader2 className="animate-spin" />}
          Confirm order
        </Button>
      )}
      {status === "CONFIRMED" && (
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await fulfillOrder(orderId);
                toast.success("Order fulfilled");
                router.refresh();
              } catch {
                toast.error("Failed to fulfill order");
              }
            })
          }
        >
          {pending && <Loader2 className="animate-spin" />}
          Mark fulfilled
        </Button>
      )}
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => {
          if (!confirm("Cancel this order? Product stock will be restored.")) return;
          startTransition(async () => {
            try {
              await cancelOrder(orderId);
              toast.success("Order cancelled");
              router.refresh();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed to cancel order");
            }
          });
        }}
      >
        Cancel order
      </Button>
    </div>
  );
}
