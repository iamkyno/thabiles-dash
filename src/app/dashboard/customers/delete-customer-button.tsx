"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { deleteCustomer } from "@/actions/customers";
import { Button } from "@/components/ui/button";

export function DeleteCustomerButton({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this customer? This cannot be undone.")) return;
        startTransition(async () => {
          try {
            await deleteCustomer(customerId);
            toast.success("Customer deleted");
            router.refresh();
          } catch {
            toast.error("Failed to delete customer — they may have existing orders.");
          }
        });
      }}
    >
      <Trash2 className="text-destructive" />
    </Button>
  );
}
