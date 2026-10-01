"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

import { deleteOrder } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

export function DeleteOrderButton({
  orderId,
  orderSeq,
  returnsStock,
  hasDelivery,
  invoice,
}: {
  orderId: string;
  orderSeq: number;
  returnsStock: boolean;
  hasDelivery: boolean;
  invoice: { number: string; paymentCount: number; amountPaid: number } | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function confirmMessage() {
    const lines: string[] = [];
    if (returnsStock) lines.push("• Its products will be put back into stock.");
    if (invoice) {
      const payments =
        invoice.paymentCount === 0
          ? ""
          : ` and ${invoice.paymentCount} payment${invoice.paymentCount === 1 ? "" : "s"} (${formatMoney(invoice.amountPaid)})`;
      lines.push(`• Invoice ${invoice.number}${payments} will also be deleted${payments ? " and won't count in revenue any more" : ""}.`);
    }
    if (hasDelivery) lines.push("• Its delivery will be deleted.");
    const details = lines.length ? `\n\n${lines.join("\n")}` : "";
    return `Delete order #${orderSeq} permanently?${details}\n\nThis can't be undone.`;
  }

  return (
    <Button
      variant="outline"
      className="text-destructive hover:text-destructive"
      disabled={pending}
      onClick={() => {
        if (!confirm(confirmMessage())) return;
        startTransition(async () => {
          try {
            const result = await deleteOrder(orderId);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success(`Order #${orderSeq} deleted`);
            router.push("/dashboard/orders");
            router.refresh();
          } catch {
            toast.error("Failed to delete order");
          }
        });
      }}
    >
      {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
      Delete order
    </Button>
  );
}
