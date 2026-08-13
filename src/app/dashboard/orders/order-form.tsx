"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { createOrder } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { orderSchema, type OrderFormValues } from "./schema";

type Option = { id: string; label: string; address?: string };
type ProductOption = { id: string; name: string; sellPrice: number; stockQty: number };

export function OrderForm({ customers, products }: { customers: Option[]; products: ProductOption[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerId: "",
      items: [],
      discountTotal: 0,
      taxRatePercent: 0,
      needsDelivery: false,
      deliveryAddress: "",
    },
  });

  const itemFields = useFieldArray({ control: form.control, name: "items" });
  const items = form.watch("items");
  const needsDelivery = form.watch("needsDelivery");
  const discountTotal = form.watch("discountTotal");
  const taxRatePercent = form.watch("taxRatePercent");

  const subtotal = useMemo(() => {
    let sum = 0;
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (product) sum += product.sellPrice * (item.quantity || 0);
    }
    return sum;
  }, [items, products]);

  const taxTotal = (subtotal * (taxRatePercent || 0)) / 100;
  const total = subtotal + taxTotal - (discountTotal || 0);

  async function onSubmit(values: OrderFormValues) {
    setSubmitting(true);
    try {
      const order = await createOrder(values);
      toast.success("Order created");
      router.push(`/dashboard/orders/${order.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>New order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      const c = customers.find((cc) => cc.id === v);
                      if (c?.address) form.setValue("deliveryAddress", c.address);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
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
                <FormLabel>Products</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => itemFields.append({ productId: "", quantity: 1 })}
                >
                  <Plus /> Add product
                </Button>
              </div>
              {itemFields.fields.map((f, index) => (
                <div key={f.id} className="flex items-end gap-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.productId`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} ({p.stockQty} in stock) — {formatMoney(p.sellPrice)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="w-24">
                    <NumberField control={form.control} name={`items.${index}.quantity`} label="" min="1" />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => itemFields.remove(index)}>
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
              ))}
              {form.formState.errors.items?.message && (
                <p className="text-sm text-destructive">{form.formState.errors.items.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <NumberField control={form.control} name="taxRatePercent" label="Tax rate (%)" step="0.01" />
              <NumberField control={form.control} name="discountTotal" label="Discount" step="0.01" />
            </div>

            <FormField
              control={form.control}
              name="needsDelivery"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <FormLabel className="mb-0">Needs delivery</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {needsDelivery && (
              <FormField
                control={form.control}
                name="deliveryAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="space-y-1 rounded-lg border p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatMoney(taxTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-{formatMoney(discountTotal || 0)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              Create order
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
