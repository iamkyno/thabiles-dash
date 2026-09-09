"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  Beaker,
  ClipboardList,
  Package,
  FlaskConical,
  Factory,
  Users,
  ShoppingCart,
  MapPinned,
  Receipt,
  BarChart3,
  Settings,
  MessageSquare,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, key: null },
  { href: "/dashboard/suppliers", label: "Suppliers", icon: Truck, key: "suppliers" },
  { href: "/dashboard/materials", label: "Materials", icon: Beaker, key: "materials" },
  { href: "/dashboard/purchase-orders", label: "Purchase orders", icon: ClipboardList, key: "purchase-orders" },
  { href: "/dashboard/products", label: "Products", icon: Package, key: "products" },
  { href: "/dashboard/recipes", label: "Recipes", icon: FlaskConical, key: "recipes" },
  { href: "/dashboard/production", label: "Production", icon: Factory, key: "production" },
  { href: "/dashboard/customers", label: "Customers", icon: Users, key: "customers" },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart, key: "orders" },
  { href: "/dashboard/deliveries", label: "Deliveries", icon: MapPinned, key: "deliveries" },
  { href: "/dashboard/invoices", label: "Invoices", icon: Receipt, key: "invoices" },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3, key: "reports" },
];

export function SidebarNav({
  isAdmin,
  allowedSections,
}: {
  isAdmin: boolean;
  allowedSections: string[];
}) {
  const pathname = usePathname();
  const visibleItems = navItems.filter(
    (item) => isAdmin || item.key === null || allowedSections.includes(item.key)
  );

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      {visibleItems.map((item) => {
        const active =
          item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
      <div
        className="cursor-not-allowed rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/60"
        aria-disabled="true"
      >
        <div className="flex justify-end">
          <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground/60">
            Coming soon
          </Badge>
        </div>
        <div className="flex items-center gap-2.5">
          <MessageSquare className="size-4 shrink-0" />
          SMS Campaigns
        </div>
      </div>
      {isAdmin && (
        <Link
          href="/dashboard/settings/business"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/dashboard/settings")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Settings className="size-4 shrink-0" />
          Settings
        </Link>
      )}
    </nav>
  );
}
