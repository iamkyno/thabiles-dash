"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { updateDeliveryDetails } from "@/actions/deliveries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { deliveryDetailsSchema, type DeliveryDetailsValues } from "./schema";

export function DeliveryDetailsForm({
  deliveryId,
  defaultValues,
}: {
  deliveryId: string;
  defaultValues: DeliveryDetailsValues;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<DeliveryDetailsValues>({ resolver: zodResolver(deliveryDetailsSchema), defaultValues });

  async function onSubmit(values: DeliveryDetailsValues) {
    setSubmitting(true);
    try {
      const result = await updateDeliveryDetails(deliveryId, values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Delivery details saved");
      form.reset(values);
      router.refresh();
    } catch {
      toast.error("Failed to save delivery details");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery address</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" />}
          Save details
        </Button>
      </form>
    </Form>
  );
}
