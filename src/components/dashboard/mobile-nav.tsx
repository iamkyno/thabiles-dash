"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { UserMenu } from "@/components/dashboard/user-menu";

export function MobileNav({
  isAdmin,
  allowedSections,
  userName,
  userEmail,
  userRole,
}: {
  isAdmin: boolean;
  allowedSections: string[];
  userName: string;
  userEmail: string;
  userRole: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Menu />
      </Button>
      <DialogContent className="left-0 top-0 h-full max-h-full w-64 max-w-64 translate-x-0 translate-y-0 rounded-none border-r p-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
        <DialogTitle className="sr-only">Navigation</DialogTitle>
        <div className="flex h-full flex-col" onClick={() => setOpen(false)}>
          <div className="flex h-14 items-center border-b px-4 font-semibold">
            TSC-Thabiles Skin Care
          </div>
          <SidebarNav isAdmin={isAdmin} allowedSections={allowedSections} />
          <div className="border-t p-2">
            <UserMenu name={userName} email={userEmail} role={userRole} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
