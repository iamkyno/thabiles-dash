"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Receipt } from "lucide-react";

import { generateInvoice } from "@/actions/invoices";
import { Button } from "@/components/ui/button";

export function GenerateInvoiceButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            const result = await generateInvoice(orderId);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success("Invoice generated");
            router.push(`/dashboard/invoices/${result.data.id}`);
          } catch {
            toast.error("Failed to generate invoice");
          }
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <Receipt />}
      Generate invoice
    </Button>
  );
}
