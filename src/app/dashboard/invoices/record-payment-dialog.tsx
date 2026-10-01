"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

import { recordPayment } from "@/actions/invoices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { NumberField } from "@/components/forms/number-field";
import { formatMoney } from "@/lib/money";
import { paymentMethods, paymentMethodLabels } from "./schema";

function paymentSchema(balance: number) {
  return z.object({
    amount: z
      .number({ error: "Enter an amount" })
      .positive("Amount must be greater than 0")
      .refine((v) => Math.round(v * 100) <= Math.round(balance * 100), {
        message: `Only ${formatMoney(balance)} is still owed`,
      }),
    method: z.enum(paymentMethods),
    reference: z.string().optional(),
  });
}

type PaymentValues = z.infer<ReturnType<typeof paymentSchema>>;

export function RecordPaymentDialog({ invoiceId, balance }: { invoiceId: string; balance: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const schema = useMemo(() => paymentSchema(balance), [balance]);
  const form = useForm<PaymentValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: balance, method: "CASH", reference: "" },
  });

  async function onSubmit(values: PaymentValues) {
    setSubmitting(true);
    try {
      const result = await recordPayment(invoiceId, values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Payment recorded");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Start from what's owed now, not what was owed when the page first loaded.
        if (next) form.reset({ amount: balance, method: "CASH", reference: "" });
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus /> Record payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>{formatMoney(balance)} is still owed on this invoice.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <NumberField control={form.control} name="amount" label="Amount" step="0.01" />
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Method</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentMethods.map((m) => (
                        <SelectItem key={m} value={m}>
                          {paymentMethodLabels[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
                {submitting && <Loader2 className="animate-spin" />}
                Record payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
