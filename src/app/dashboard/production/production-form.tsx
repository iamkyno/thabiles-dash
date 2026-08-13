"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { createProductionBatch } from "@/actions/production";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

const schema = z.object({
  productId: z.string().min(1, "Select a product"),
  plannedQty: z.number().int().positive("Planned quantity must be greater than 0"),
});

type FormValues = z.infer<typeof schema>;

export function ProductionForm({
  products,
}: {
  products: { id: string; name: string; yieldQuantity: number }[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { productId: "", plannedQty: products[0]?.yieldQuantity ?? 1 },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const batch = await createProductionBatch(values);
      toast.success("Production batch created");
      router.push(`/dashboard/production/${batch.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create batch");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>New production batch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      const p = products.find((pp) => pp.id === v);
                      if (p) form.setValue("plannedQty", p.yieldQuantity);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <NumberField control={form.control} name="plannedQty" label="Planned quantity (finished units)" />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              Create batch
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
