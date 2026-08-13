"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { saveRecipe } from "@/actions/recipes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  yieldQuantity: z.number().int().positive("Yield must be at least 1"),
  instructions: z.string().optional(),
  items: z
    .array(
      z.object({
        materialId: z.string().min(1, "Select a material"),
        quantityPerBatch: z.number().positive("Quantity must be greater than 0"),
      })
    )
    .min(1, "Add at least one ingredient"),
});

type FormValues = z.infer<typeof schema>;

type MaterialOption = { id: string; name: string; unit: string };

export function RecipeForm({
  productId,
  materials,
  defaultValues,
}: {
  productId: string;
  materials: MaterialOption[];
  defaultValues: FormValues;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const itemFields = useFieldArray({ control: form.control, name: "items" });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      await saveRecipe(productId, values);
      toast.success("Recipe saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save recipe");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <NumberField control={form.control} name="yieldQuantity" label="Batch yield (finished units)" />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <FormLabel>Ingredients per batch</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => itemFields.append({ materialId: "", quantityPerBatch: 1 })}
            >
              <Plus /> Add ingredient
            </Button>
          </div>
          {itemFields.fields.map((f, index) => {
            const materialId = form.watch(`items.${index}.materialId`);
            const material = materials.find((m) => m.id === materialId);
            return (
              <div key={f.id} className="flex items-end gap-2">
                <FormField
                  control={form.control}
                  name={`items.${index}.materialId`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <Select value={field.value} onValueChange={field.onChange}>
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
                <div className="w-28">
                  <NumberField
                    control={form.control}
                    name={`items.${index}.quantityPerBatch`}
                    label=""
                    step="0.001"
                  />
                </div>
                {material && <span className="pb-2 text-sm text-muted-foreground">{material.unit}</span>}
                <Button type="button" variant="ghost" size="icon" onClick={() => itemFields.remove(index)}>
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            );
          })}
          {form.formState.errors.items?.message && (
            <p className="text-sm text-destructive">{form.formState.errors.items.message}</p>
          )}
        </div>

        <FormField
          control={form.control}
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions (optional)</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" />}
          Save recipe
        </Button>
      </form>
    </Form>
  );
}
