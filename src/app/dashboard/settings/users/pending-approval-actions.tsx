"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { approveUser, rejectUser } from "@/actions/users";
import { Button } from "@/components/ui/button";

export function PendingApprovalActions({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex justify-end gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await rejectUser(userId);
              toast.success("Registration rejected");
            } catch {
              toast.error("Failed to reject registration");
            }
          })
        }
      >
        Reject
      </Button>
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await approveUser(userId);
              toast.success("Account approved");
            } catch {
              toast.error("Failed to approve account");
            }
          })
        }
      >
        Approve
      </Button>
    </div>
  );
}
