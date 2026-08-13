import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export async function getCurrentSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireOwner() {
  const session = await requireSession();
  if (session.user.role !== "OWNER") {
    redirect("/dashboard");
  }
  return session;
}
