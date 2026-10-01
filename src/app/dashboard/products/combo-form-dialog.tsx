"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { createCombo, updateCombo } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { comboSchema, type ComboFormValues } from "./schema";

const emptyCombo: ComboFormValues = {
  name: "",
  sku: "",
  sellPrice: 0,
  isActive: true,
  products: [{ productId: "", quantity: 1 }],
  extras: [],
};

export function ComboFormDialog({
  comboId,
  defaultValues,
  productOptions,
}: {
  comboId?: string;
  defaultValues?: ComboFormValues;
  productOptions: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(comboId);

  const form = useForm<ComboFormValues>({
    resolver: zodResolver(comboSchema),
    defaultValues: defaultValues ?? emptyCombo,
  });
  const productLines = useFieldArray({ control: form.control, name: "products" });
  const extraLines = useFieldArray({ control: form.control, name: "extras" });
  const productsError = form.formState.errors.products;

  async function onSubmit(values: ComboFormValues) {
    setSubmitting(true);
    try {
      const result = comboId ? await updateCombo(comboId, values) : await createCombo(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(comboId ? "Combo updated" : "Combo added");
      if (!comboId) form.reset(emptyCombo);
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon" aria-label="Edit combo">
            <Pencil />
          </Button>
        ) : (
          <Button variant="outline">
            <Plus /> Add combo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit combo" : "Add combo"}</DialogTitle>
          <DialogDescription>
            Selling a combo takes its products out of stock. Other items are listed but not stock-counted.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Primary Combo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. COMBO-PRIMARY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <NumberField control={form.control} name="sellPrice" label="Price" step="0.01" />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 sm:mt-auto">
                    <FormLabel className="mb-0">Available for sale</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Products (taken from stock)</h3>
              {productLines.fields.map((f, index) => (
                <div
                  key={f.id}
                  className="flex flex-col gap-2 rounded-md border p-2 sm:flex-row sm:items-end sm:border-0 sm:p-0"
                >
                  <FormField
                    control={form.control}
                    name={`products.${index}.productId`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full" aria-label="Product">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {productOptions.map((p) => (
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
                  <div className="flex items-end gap-2">
                    <div className="flex-1 sm:w-20 sm:flex-none">
                      <NumberField control={form.control} name={`products.${index}.quantity`} label="Qty" min="1" />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove product"
                      disabled={productLines.fields.length === 1}
                      onClick={() => productLines.remove(index)}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {(productsError?.message || productsError?.root?.message) && (
                <p className="text-sm text-destructive">{productsError.message ?? productsError.root?.message}</p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => productLines.append({ productId: "", quantity: 1 })}
              >
                <Plus /> Add product
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Other items (not stock-counted)</h3>
              {extraLines.fields.length === 0 && (
                <p className="text-sm text-muted-foreground">e.g. bottles or containers included with the combo.</p>
              )}
              {extraLines.fields.map((f, index) => (
                <div
                  key={f.id}
                  className="flex flex-col gap-2 rounded-md border p-2 sm:flex-row sm:items-end sm:border-0 sm:p-0"
                >
                  <FormField
                    control={form.control}
                    name={`extras.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="e.g. 30ml dropper bottles" aria-label="Item" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-end gap-2">
                    <div className="flex-1 sm:w-20 sm:flex-none">
                      <NumberField control={form.control} name={`extras.${index}.quantity`} label="Qty" min="1" />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove item"
                      onClick={() => extraLines.remove(index)}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => extraLines.append({ description: "", quantity: 1 })}
              >
                <Plus /> Add item
              </Button>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="animate-spin" />}
                {isEdit ? "Save changes" : "Add combo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
