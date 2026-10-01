"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { updateDeliveryStatus } from "@/actions/deliveries";
import { Button } from "@/components/ui/button";

type Status = "PENDING" | "IN_TRANSIT" | "DELIVERED" | "FAILED";

const transitions: Record<string, { label: string; done: string; status: Status }[]> = {
  PENDING: [{ label: "Mark in transit", done: "Delivery marked in transit", status: "IN_TRANSIT" }],
  IN_TRANSIT: [
    { label: "Mark delivered", done: "Delivery marked delivered", status: "DELIVERED" },
    { label: "Mark failed", done: "Delivery marked failed", status: "FAILED" },
  ],
  DELIVERED: [],
  FAILED: [{ label: "Retry (mark in transit)", done: "Delivery marked in transit", status: "IN_TRANSIT" }],
};

export function DeliveryStatusActions({ deliveryId, status }: { deliveryId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [clicked, setClicked] = useState<Status | null>(null);
  const options = transitions[status] ?? [];

  if (options.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {options.map((opt) => (
        <Button
          key={opt.status}
          className="w-full sm:w-auto"
          variant={opt.status === "FAILED" ? "outline" : "default"}
          disabled={pending}
          onClick={() => {
            setClicked(opt.status);
            startTransition(async () => {
              try {
                const result = await updateDeliveryStatus(deliveryId, opt.status);
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success(opt.done);
                router.refresh();
              } catch {
                toast.error("Failed to update delivery");
              }
            });
          }}
        >
          {pending && clicked === opt.status && <Loader2 className="animate-spin" />}
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
