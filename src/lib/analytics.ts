import "server-only";

import { prisma } from "@/lib/prisma";

export async function getDashboardMetrics() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [materials, products, openOrdersCount, pendingDeliveriesCount, monthPayments] = await Promise.all([
    prisma.material.findMany({ where: { isActive: true } }),
    prisma.finishedProduct.findMany({ where: { isActive: true } }),
    prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED"] } } }),
    prisma.delivery.count({ where: { status: { in: ["PENDING", "IN_TRANSIT"] } } }),
    prisma.payment.aggregate({ where: { paidAt: { gte: startOfMonth } }, _sum: { amount: true } }),
  ]);

  const lowStockMaterials = materials
    .filter((m) => Number(m.stockQty) <= Number(m.reorderLevel))
    .sort((a, b) => Number(a.stockQty) - Number(b.stockQty));
  const lowStockProducts = products
    .filter((p) => p.stockQty <= p.reorderLevel)
    .sort((a, b) => a.stockQty - b.stockQty);

  return {
    lowStockMaterials,
    lowStockProducts,
    openOrdersCount,
    pendingDeliveriesCount,
    monthRevenue: Number(monthPayments._sum.amount ?? 0),
  };
}

export async function getRevenueTrend(months = 6) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const payments = await prisma.payment.findMany({
    where: { paidAt: { gte: start } },
    select: { amount: true, paidAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
  }
  for (const p of payments) {
    const key = `${p.paidAt.getFullYear()}-${p.paidAt.getMonth()}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + Number(p.amount));
  }

  return Array.from(buckets.entries()).map(([key, total]) => {
    const [y, m] = key.split("-").map(Number);
    const label = new Date(y, m, 1).toLocaleString("en-GB", { month: "short" });
    return { month: label, revenue: Math.round(total * 100) / 100 };
  });
}

export async function getTopProducts(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const items = await prisma.orderItem.findMany({
    where: { order: { createdAt: { gte: since }, status: { not: "CANCELLED" } } },
    include: { product: true },
  });

  const map = new Map<string, { name: string; revenue: number; qty: number }>();
  for (const item of items) {
    const cur = map.get(item.product.id) ?? { name: item.product.name, revenue: 0, qty: 0 };
    cur.revenue += Number(item.lineTotal);
    cur.qty += item.quantity;
    map.set(item.product.id, cur);
  }

  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
}

export async function getInventoryValue() {
  const [materials, products] = await Promise.all([
    prisma.material.findMany({ where: { isActive: true } }),
    prisma.finishedProduct.findMany({ where: { isActive: true } }),
  ]);

  const rawMaterialsCost = materials.reduce((sum, m) => sum + Number(m.stockQty) * Number(m.costPerUnit), 0);
  const finishedGoodsRetailValue = products.reduce((sum, p) => sum + p.stockQty * Number(p.sellPrice), 0);

  return { rawMaterialsCost, finishedGoodsRetailValue };
}

export async function getDeliveryStatusBreakdown() {
  const deliveries = await prisma.delivery.groupBy({ by: ["status"], _count: { _all: true } });
  return deliveries.map((d) => ({ status: d.status, count: d._count._all }));
}
