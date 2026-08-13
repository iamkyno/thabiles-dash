import Link from "next/link";

import { requireSession } from "@/lib/session";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { UserMenu } from "@/components/dashboard/user-menu";
import { MobileNav } from "@/components/dashboard/mobile-nav";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const session = await requireSession();
  const isOwner = session.user.role === "OWNER";

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="font-semibold">
            Thabile&apos;s Naturals
          </Link>
        </div>
        <SidebarNav isOwner={isOwner} />
        <div className="border-t p-2">
          <UserMenu name={session.user.name} email={session.user.email} role={session.user.role ?? "STAFF"} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex h-14 items-center gap-3 border-b px-4 md:hidden">
          <MobileNav isOwner={isOwner} userName={session.user.name} userEmail={session.user.email} userRole={session.user.role ?? "STAFF"} />
          <span className="font-semibold">Thabile&apos;s Naturals</span>
        </header>
        <main className="flex-1 bg-muted/20 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
