"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive } from "lucide-react";

import { deactivateMaterial } from "@/actions/materials";
import { Button } from "@/components/ui/button";

export function DeactivateMaterialButton({ materialId }: { materialId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      onClick={() => {
        if (!confirm("Deactivate this material? It will be hidden from new recipes and purchase orders.")) return;
        startTransition(async () => {
          try {
            await deactivateMaterial(materialId);
            toast.success("Material deactivated");
            router.refresh();
          } catch {
            toast.error("Failed to deactivate material");
          }
        });
      }}
    >
      <Archive className="text-destructive" />
    </Button>
  );
}
