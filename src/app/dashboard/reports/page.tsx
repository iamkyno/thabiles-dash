import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireSession } from "@/lib/session";
import { getRevenueTrend, getTopProducts, getInventoryValue, getDeliveryStatusBreakdown } from "@/lib/analytics";
import { formatMoney } from "@/lib/money";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { deliveryStatusVariants } from "../deliveries/schema";

export default async function ReportsPage() {
  await requireSession();
  const [revenueTrend, topProducts, inventoryValue, deliveryBreakdown] = await Promise.all([
    getRevenueTrend(12),
    getTopProducts(30),
    getInventoryValue(),
    getDeliveryStatusBreakdown(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-muted-foreground">Revenue, inventory and delivery performance.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue (last 12 months)</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={revenueTrend} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inventory value</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Raw materials (at cost)</span>
              <span className="font-medium">{formatMoney(inventoryValue.rawMaterialsCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Finished goods (at retail)</span>
              <span className="font-medium">{formatMoney(inventoryValue.finishedGoodsRetailValue)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deliveries by status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {deliveryBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deliveries yet.</p>
            ) : (
              deliveryBreakdown.map((d) => (
                <div key={d.status} className="flex items-center justify-between text-sm">
                  <Badge variant={deliveryStatusVariants[d.status]}>{d.status.replace("_", " ")}</Badge>
                  <span>{d.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top products</CardTitle>
          <CardDescription>Last 30 days by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell className="text-right">{p.qty}</TableCell>
                    <TableCell className="text-right">{formatMoney(p.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
