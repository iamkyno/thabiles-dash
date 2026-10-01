import Link from "next/link";
import { MapPinned, PackageX, ShoppingCart, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/session";
import { getDashboardMetrics, getRevenueTrend } from "@/lib/analytics";
import { formatMoney } from "@/lib/money";
import { productLabel } from "@/lib/product-label";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";

export default async function DashboardHomePage() {
  const session = await requireSession();
  const [metrics, revenueTrend] = await Promise.all([getDashboardMetrics(), getRevenueTrend(6)]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {session.user.name.split(" ")[0]}</h1>
        <p className="text-muted-foreground">Here&apos;s what&apos;s happening at the workshop.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue this month" value={formatMoney(metrics.monthRevenue)} icon={Wallet} />
        <StatCard label="Open orders" value={String(metrics.openOrdersCount)} icon={ShoppingCart} />
        <StatCard label="Pending deliveries" value={String(metrics.pendingDeliveriesCount)} icon={MapPinned} />
        <StatCard
          label="Low stock alerts"
          value={String(metrics.lowStockProducts.length)}
          icon={PackageX}
          tone={metrics.lowStockProducts.length > 0 ? "warning" : "default"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue (last 6 months)</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={revenueTrend} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Low product stock</CardTitle>
            <CardDescription>Products at or below their low-stock alert level.</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">All products are well stocked.</p>
            ) : (
              <div className="space-y-2">
                {metrics.lowStockProducts.map((p) => (
                  <Link
                    key={p.id}
                    href="/dashboard/products"
                    className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm hover:bg-accent"
                  >
                    <span className="font-medium">{productLabel(p)}</span>
                    <Badge variant="warning">{p.stockQty} left</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock orders awaiting delivery</CardTitle>
            <CardDescription>Mark them received when they arrive to update product stock.</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.openStockOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing on order right now.</p>
            ) : (
              <div className="space-y-2">
                {metrics.openStockOrders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/dashboard/stock-orders/${o.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm hover:bg-accent"
                  >
                    <span className="font-medium">Stock order #{o.stockOrderSeq}</span>
                    <Badge variant="warning">
                      {o.items.reduce((sum, i) => sum + i.quantity, 0)} units
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
