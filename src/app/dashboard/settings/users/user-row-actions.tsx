"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";

import { setUserBanned, setUserRole } from "@/actions/users";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserRowActions({
  userId,
  role,
  banned,
  isSelf,
}: {
  userId: string;
  role: string;
  banned: boolean;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={pending}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={isSelf}
          onClick={() =>
            startTransition(async () => {
              try {
                await setUserRole(userId, role === "OWNER" ? "STAFF" : "OWNER");
                toast.success("Role updated");
              } catch {
                toast.error("Failed to update role");
              }
            })
          }
        >
          Make {role === "OWNER" ? "Staff" : "Owner"}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant={banned ? "default" : "destructive"}
          disabled={isSelf}
          onClick={() =>
            startTransition(async () => {
              try {
                await setUserBanned(userId, !banned);
                toast.success(banned ? "Account reactivated" : "Account deactivated");
              } catch {
                toast.error("Failed to update account");
              }
            })
          }
        >
          {banned ? "Reactivate" : "Deactivate"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
