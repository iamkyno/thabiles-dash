"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { requireOwner } from "@/lib/session";

const createStaffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["OWNER", "STAFF"]),
  phone: z.string().optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export async function createStaffUser(input: CreateStaffInput) {
  await requireOwner();
  const data = createStaffSchema.parse(input);

  await auth.api.createUser({
    body: {
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role as never,
      data: { phone: data.phone },
    },
    headers: await headers(),
  });

  revalidatePath("/dashboard/settings/users");
}

export async function setUserBanned(userId: string, banned: boolean) {
  await requireOwner();
  if (banned) {
    await auth.api.banUser({ body: { userId }, headers: await headers() });
  } else {
    await auth.api.unbanUser({ body: { userId }, headers: await headers() });
  }
  revalidatePath("/dashboard/settings/users");
}

export async function setUserRole(userId: string, role: "OWNER" | "STAFF") {
  await requireOwner();
  await auth.api.setRole({ body: { userId, role: role as never }, headers: await headers() });
  revalidatePath("/dashboard/settings/users");
}
