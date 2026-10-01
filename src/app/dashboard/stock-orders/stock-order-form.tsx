"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { createStockOrder } from "@/actions/stock-orders";
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
import { formatMoney } from "@/lib/money";
import { stockOrderSchema, type StockOrderFormValues } from "./schema";

type ProductOption = { id: string; name: string; stockQty: number; lastUnitCost: number | null };

export function StockOrderForm({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<StockOrderFormValues>({
    resolver: zodResolver(stockOrderSchema),
    defaultValues: { items: [{ productId: "", quantity: 1, unitCost: 0 }] },
  });

  const itemFields = useFieldArray({ control: form.control, name: "items" });
  const items = useWatch({ control: form.control, name: "items" });
  const total = items.reduce((sum, i) => sum + (i.quantity || 0) * (i.unitCost || 0), 0);

  async function onSubmit(values: StockOrderFormValues) {
    setSubmitting(true);
    try {
      const result = await createStockOrder(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Stock order created");
      router.push(`/dashboard/stock-orders/${result.data.id}`);
    } catch {
      toast.error("Failed to create stock order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>New stock order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {itemFields.fields.map((f, index) => (
              <div key={f.id} className="space-y-3 rounded-lg border p-3">
                <FormField
                  control={form.control}
                  name={`items.${index}.productId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v);
                          const lastUnitCost = products.find((p) => p.id === v)?.lastUnitCost;
                          if (lastUnitCost != null) form.setValue(`items.${index}.unitCost`, lastUnitCost);
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
                              {p.name} · {p.stockQty} in stock
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <NumberField control={form.control} name={`items.${index}.quantity`} label="Quantity" min="1" />
                  </div>
                  <div className="flex-1">
                    <NumberField control={form.control} name={`items.${index}.unitCost`} label="Unit cost" step="0.01" />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove product"
                    disabled={itemFields.fields.length === 1}
                    onClick={() => itemFields.remove(index)}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {form.formState.errors.items?.message && (
              <p className="text-sm text-destructive">{form.formState.errors.items.message}</p>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => itemFields.append({ productId: "", quantity: 1, unitCost: 0 })}
            >
              <Plus /> Add another product
            </Button>

            <div className="flex justify-between rounded-lg border p-3 text-sm font-semibold">
              <span>Total cost</span>
              <span>{formatMoney(total)}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              Create stock order
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
