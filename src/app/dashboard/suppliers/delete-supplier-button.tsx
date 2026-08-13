"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { deleteSupplier } from "@/actions/suppliers";
import { Button } from "@/components/ui/button";

export function DeleteSupplierButton({ supplierId }: { supplierId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this supplier? This cannot be undone.")) return;
        startTransition(async () => {
          try {
            await deleteSupplier(supplierId);
            toast.success("Supplier deleted");
            router.refresh();
          } catch {
            toast.error("Failed to delete supplier — they may have linked materials or purchase orders.");
          }
        });
      }}
    >
      <Trash2 className="text-destructive" />
    </Button>
  );
}
