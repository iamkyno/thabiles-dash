"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { sanitizeSections } from "@/lib/sections";

const createStaffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "STAFF"]),
  phone: z.string().optional(),
  allowedSections: z.array(z.string()).optional().default([]),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export async function createStaffUser(input: CreateStaffInput) {
  await requireAdmin();
  const data = createStaffSchema.parse(input);
  const allowedSections = sanitizeSections(data.allowedSections);

  await auth.api.createUser({
    body: {
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role as never,
      data: { phone: data.phone, allowedSections },
    },
    headers: await headers(),
  });

  revalidatePath("/dashboard/settings/users");
}

export async function setUserBanned(userId: string, banned: boolean) {
  await requireAdmin();
  if (banned) {
    await auth.api.banUser({ body: { userId }, headers: await headers() });
  } else {
    await auth.api.unbanUser({ body: { userId }, headers: await headers() });
  }
  revalidatePath("/dashboard/settings/users");
}

export async function setUserRole(userId: string, role: "ADMIN" | "STAFF") {
  await requireAdmin();
  await auth.api.setRole({ body: { userId, role: role as never }, headers: await headers() });
  revalidatePath("/dashboard/settings/users");
}

export async function updateUserSections(userId: string, sections: string[]) {
  await requireAdmin();
  const allowedSections = sanitizeSections(sections);
  await prisma.user.update({ where: { id: userId }, data: { allowedSections } });
  revalidatePath("/dashboard/settings/users");
}

export async function approveUser(userId: string) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { approvalStatus: "APPROVED" } });
  revalidatePath("/dashboard/settings/users");
}

export async function rejectUser(userId: string) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { approvalStatus: "REJECTED" } });
  revalidatePath("/dashboard/settings/users");
}

export async function resetUserPassword(userId: string, newPassword: string) {
  await requireAdmin();
  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  await auth.api.setUserPassword({ body: { userId, newPassword }, headers: await headers() });
}

export async function deleteUser(userId: string) {
  await requireAdmin();
  const target = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (target.role === "DEVELOPER") {
    throw new Error("The Developer account can't be deleted.");
  }

  try {
    await auth.api.removeUser({ body: { userId }, headers: await headers() });
  } catch (err) {
    if (err instanceof Error && /foreign key|constraint/i.test(err.message)) {
      throw new Error("This user has activity on record — deactivate instead of deleting.");
    }
    throw err;
  }

  revalidatePath("/dashboard/settings/users");
}
