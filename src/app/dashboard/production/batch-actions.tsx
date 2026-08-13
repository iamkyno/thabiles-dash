"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { startProductionBatch, cancelProductionBatch, completeProductionBatch } from "@/actions/production";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { NumberField } from "@/components/forms/number-field";

export function StartBatchButton({ batchId }: { batchId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await startProductionBatch(batchId);
            toast.success("Batch started");
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to start batch");
          }
        })
      }
    >
      {pending && <Loader2 className="animate-spin" />}
      Start batch
    </Button>
  );
}

export function CancelBatchButton({ batchId }: { batchId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() => {
        if (!confirm("Cancel this production batch?")) return;
        startTransition(async () => {
          try {
            await cancelProductionBatch(batchId);
            toast.success("Batch cancelled");
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to cancel batch");
          }
        });
      }}
    >
      Cancel batch
    </Button>
  );
}

const schema = z.object({ actualQty: z.number().int().positive() });

export function CompleteBatchDialog({ batchId, plannedQty }: { batchId: string; plannedQty: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { actualQty: plannedQty },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setSubmitting(true);
    try {
      await completeProductionBatch(batchId, values);
      toast.success("Batch completed — stock updated");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to complete batch");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Complete batch</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete batch</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will consume ingredients from stock (scaled to actual quantity) and add finished units to
              product inventory.
            </p>
            <NumberField control={form.control} name="actualQty" label="Actual quantity produced" />
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="animate-spin" />}
                Complete batch
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
