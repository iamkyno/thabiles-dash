import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth, type Session } from "@/lib/auth";

export async function getCurrentSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }
  if (session.user.approvalStatus && session.user.approvalStatus !== "APPROVED") {
    redirect("/pending-approval");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN" && session.user.role !== "DEVELOPER") {
    redirect("/dashboard");
  }
  return session;
}

export async function requireSection(session: Session, key: string) {
  if (session.user.role === "ADMIN" || session.user.role === "DEVELOPER") {
    return;
  }
  const allowedSections = (session.user.allowedSections ?? []) as string[];
  if (!allowedSections.includes(key)) {
    redirect("/dashboard");
  }
}
