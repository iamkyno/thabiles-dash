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
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/suppliers", label: "Suppliers", icon: Truck },
  { href: "/dashboard/materials", label: "Materials", icon: Beaker },
  { href: "/dashboard/purchase-orders", label: "Purchase orders", icon: ClipboardList },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/recipes", label: "Recipes", icon: FlaskConical },
  { href: "/dashboard/production", label: "Production", icon: Factory },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/deliveries", label: "Deliveries", icon: MapPinned },
  { href: "/dashboard/invoices", label: "Invoices", icon: Receipt },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
];

export function SidebarNav({ isOwner }: { isOwner: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      {navItems.map((item) => {
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
      {isOwner && (
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
