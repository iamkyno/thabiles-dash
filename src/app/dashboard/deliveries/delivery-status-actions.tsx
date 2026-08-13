"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { updateDeliveryStatus } from "@/actions/deliveries";
import { Button } from "@/components/ui/button";

const transitions: Record<string, { label: string; status: "PENDING" | "IN_TRANSIT" | "DELIVERED" | "FAILED" }[]> = {
  PENDING: [{ label: "Mark in transit", status: "IN_TRANSIT" }],
  IN_TRANSIT: [
    { label: "Mark delivered", status: "DELIVERED" },
    { label: "Mark failed", status: "FAILED" },
  ],
  DELIVERED: [],
  FAILED: [{ label: "Retry (mark in transit)", status: "IN_TRANSIT" }],
};

export function DeliveryStatusActions({ deliveryId, status }: { deliveryId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const options = transitions[status] ?? [];

  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <Button
          key={opt.status}
          variant={opt.status === "FAILED" ? "outline" : "default"}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await updateDeliveryStatus(deliveryId, opt.status);
                toast.success(`Delivery ${opt.label.toLowerCase()}`);
                router.refresh();
              } catch {
                toast.error("Failed to update delivery");
              }
            })
          }
        >
          {pending && <Loader2 className="animate-spin" />}
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
