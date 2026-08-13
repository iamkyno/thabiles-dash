"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { updateDeliveryDetails } from "@/actions/deliveries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

type FormValues = { courierName: string; trackingRef: string; notes: string };

export function DeliveryDetailsForm({ deliveryId, defaultValues }: { deliveryId: string; defaultValues: FormValues }) {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<FormValues>({ defaultValues });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      await updateDeliveryDetails(deliveryId, values);
      toast.success("Delivery details saved");
    } catch {
      toast.error("Failed to save delivery details");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="courierName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Courier</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="trackingRef"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tracking reference</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" />}
          Save details
        </Button>
      </form>
    </Form>
  );
}
