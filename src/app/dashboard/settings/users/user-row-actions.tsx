"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";

import { setUserBanned, setUserRole, updateUserSections, resetUserPassword, deleteUser } from "@/actions/users";
import { APP_SECTIONS } from "@/lib/sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function UserRowActions({
  userId,
  role,
  banned,
  allowedSections,
  isSelf,
}: {
  userId: string;
  role: string;
  banned: boolean;
  allowedSections: string[];
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [accessOpen, setAccessOpen] = useState(false);
  const [sections, setSections] = useState(allowedSections);
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const isDeveloper = role === "DEVELOPER";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={pending}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isDeveloper && (
            <DropdownMenuItem
              disabled={isSelf}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await setUserRole(userId, role === "ADMIN" ? "STAFF" : "ADMIN");
                    toast.success("Role updated");
                  } catch {
                    toast.error("Failed to update role");
                  }
                })
              }
            >
              Make {role === "ADMIN" ? "Staff" : "Admin"}
            </DropdownMenuItem>
          )}
          {role === "STAFF" && (
            <DropdownMenuItem onClick={() => setAccessOpen(true)}>Edit access</DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setResetOpen(true)}>Reset password</DropdownMenuItem>
          {!isDeveloper && (
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
          )}
          {!isDeveloper && (
            <DropdownMenuItem
              variant="destructive"
              disabled={isSelf}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await deleteUser(userId);
                    toast.success("User deleted");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Failed to delete user");
                  }
                })
              }
            >
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={accessOpen} onOpenChange={setAccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit access</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 rounded-md border p-3 sm:grid-cols-2">
            {APP_SECTIONS.map((section) => {
              const checked = sections.includes(section.key);
              return (
                <label key={section.key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => {
                      setSections((prev) =>
                        value ? [...prev, section.key] : prev.filter((k) => k !== section.key)
                      );
                    }}
                  />
                  {section.label}
                </label>
              );
            })}
          </div>
          <DialogFooter>
            <Button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await updateUserSections(userId, sections);
                    toast.success("Access updated");
                    setAccessOpen(false);
                  } catch {
                    toast.error("Failed to update access");
                  }
                })
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <DialogFooter>
            <Button
              disabled={pending || newPassword.length < 8}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await resetUserPassword(userId, newPassword);
                    toast.success("Password reset");
                    setNewPassword("");
                    setResetOpen(false);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Failed to reset password");
                  }
                })
              }
            >
              Set password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
