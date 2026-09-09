import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/session";
import { SignOutButton } from "./sign-out-button";

export default async function PendingApprovalPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }
  if (session.user.approvalStatus === "APPROVED") {
    redirect("/dashboard");
  }

  const rejected = session.user.approvalStatus === "REJECTED";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{rejected ? "Registration not approved" : "Awaiting approval"}</CardTitle>
            <CardDescription>
              {rejected
                ? "Your registration wasn't approved. Contact your administrator if you think this is a mistake."
                : "Your account is waiting for an owner or developer to approve it. Check back later."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignOutButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
