import Link from "next/link";
import { Beaker, MapPinned, PackageX, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/session";
import { getDashboardMetrics, getRevenueTrend } from "@/lib/analytics";
import { formatMoney } from "@/lib/money";
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
        <StatCard label="Open orders" value={String(metrics.openOrdersCount)} icon={Beaker} />
        <StatCard label="Pending deliveries" value={String(metrics.pendingDeliveriesCount)} icon={MapPinned} />
        <StatCard
          label="Low stock alerts"
          value={String(metrics.lowStockMaterials.length + metrics.lowStockProducts.length)}
          icon={PackageX}
          tone={metrics.lowStockMaterials.length + metrics.lowStockProducts.length > 0 ? "warning" : "default"}
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
            <CardTitle>Low material stock</CardTitle>
            <CardDescription>Ingredients and packaging at or below reorder level.</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.lowStockMaterials.length === 0 ? (
              <p className="text-sm text-muted-foreground">All materials are well stocked.</p>
            ) : (
              <div className="space-y-2">
                {metrics.lowStockMaterials.map((m) => (
                  <Link
                    key={m.id}
                    href="/dashboard/materials"
                    className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-accent"
                  >
                    <span className="font-medium">{m.name}</span>
                    <Badge variant="warning">
                      {m.stockQty.toString()} {m.unit}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low finished goods stock</CardTitle>
            <CardDescription>Products at or below reorder level.</CardDescription>
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
                    className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-accent"
                  >
                    <span className="font-medium">{p.name}</span>
                    <Badge variant="warning">{p.stockQty} left</Badge>
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
