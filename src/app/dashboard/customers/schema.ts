import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
