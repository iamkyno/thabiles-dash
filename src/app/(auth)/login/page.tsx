import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Thabile&apos;s Naturals</CardTitle>
        <CardDescription>Sign in to the operations dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
