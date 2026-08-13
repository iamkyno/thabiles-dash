"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export function NumberField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  step = "1",
  min = "0",
}: {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  step?: string;
  min?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              step={step}
              min={min}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.valueAsNumber)}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
