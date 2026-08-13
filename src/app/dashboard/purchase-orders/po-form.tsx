"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { createPurchaseOrder } from "@/actions/purchase-orders";
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
import { poSchema, type POFormValues } from "./schema";

type Option = { id: string; label: string };
type MaterialOption = { id: string; name: string; unit: string; costPerUnit: number };

export function POForm({ suppliers, materials }: { suppliers: Option[]; materials: MaterialOption[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<POFormValues>({
    resolver: zodResolver(poSchema),
    defaultValues: { supplierId: "", items: [] },
  });

  const itemFields = useFieldArray({ control: form.control, name: "items" });
  const items = form.watch("items");

  const total = useMemo(
    () => items.reduce((sum, i) => sum + (i.quantityOrdered || 0) * (i.unitCost || 0), 0),
    [items]
  );

  async function onSubmit(values: POFormValues) {
    setSubmitting(true);
    try {
      const po = await createPurchaseOrder(values);
      toast.success("Purchase order created");
      router.push(`/dashboard/purchase-orders/${po.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create purchase order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>New purchase order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Line items</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => itemFields.append({ materialId: "", quantityOrdered: 1, unitCost: 0 })}
                >
                  <Plus /> Add item
                </Button>
              </div>
              {itemFields.fields.map((f, index) => {
                const materialId = items[index]?.materialId;
                const material = materials.find((m) => m.id === materialId);
                return (
                  <div key={f.id} className="grid grid-cols-[1fr_auto_auto_auto] items-end gap-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.materialId`}
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            value={field.value}
                            onValueChange={(v) => {
                              field.onChange(v);
                              const m = materials.find((mm) => mm.id === v);
                              if (m) form.setValue(`items.${index}.unitCost`, m.costPerUnit);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select material" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {materials.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.name} ({m.unit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="w-24">
                      <NumberField
                        control={form.control}
                        name={`items.${index}.quantityOrdered`}
                        label=""
                        step="0.001"
                      />
                    </div>
                    <div className="w-28">
                      <NumberField control={form.control} name={`items.${index}.unitCost`} label="" step="0.0001" />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => itemFields.remove(index)}>
                      <Trash2 className="text-destructive" />
                    </Button>
                    {material && (
                      <p className="col-span-4 -mt-1 text-xs text-muted-foreground">
                        Qty · Unit cost (last: {formatMoney(material.costPerUnit)})
                      </p>
                    )}
                  </div>
                );
              })}
              {form.formState.errors.items?.message && (
                <p className="text-sm text-destructive">{form.formState.errors.items.message}</p>
              )}
            </div>

            <div className="flex justify-between rounded-lg border p-3 text-sm font-semibold">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              Create purchase order
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
