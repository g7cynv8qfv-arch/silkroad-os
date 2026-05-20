import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import type { Insight } from '@/lib/ai/prompts/dashboard-insights';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isoWeekMonday(d: Date): Date {
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function weekLabel(date: Date): string {
  return isoWeekMonday(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function safeDeltaPct(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type RevenueKpi = {
  thisMonthCents: number;
  deltaPercent: number | null;
  currency: string;
  sparkline: { week: string; totalCents: number }[];
};

export type OrderKpi = {
  activeCount: number;
  statusBreakdown: { status: string; count: number }[];
};

export type SupplierRiskKpi = {
  avgRisk: number | null;
  deltaPoints: number | null;
  activeCount: number;
};

export type MarginKpi = {
  marginPct: number | null;
  deltaPoints: number | null;
  deliveredCount: number;
};

export type PipelineDataPoint = {
  week: string;
  QUOTED: number;
  CONFIRMED: number;
  IN_PRODUCTION: number;
  QC: number;
  SHIPPED: number;
  DELIVERED: number;
};

export type TopSupplierVolume = {
  supplierId: string;
  supplierName: string;
  totalCents: number;
  orderCount: number;
};

export type ActivityItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  actorName: string | null;
  actorAvatar: string | null;
};

export type OrgEmptyState = {
  isEmpty: boolean;
  supplierCount: number;
  orderCount: number;
};

// ─── Revenue KPI ──────────────────────────────────────────────────────────────

async function _getRevenueKpi(orgId: string): Promise<RevenueKpi> {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 3600 * 1000);

  const [thisMonth, lastMonth, weeklyInvoices] = await Promise.all([
    db.invoice.aggregate({
      where: {
        organizationId: orgId,
        status: { in: ['SENT', 'PAID', 'OVERDUE'] },
        issueDate: { gte: thisMonthStart },
      },
      _sum: { totalCents: true },
    }),
    db.invoice.aggregate({
      where: {
        organizationId: orgId,
        status: { in: ['SENT', 'PAID', 'OVERDUE'] },
        issueDate: { gte: lastMonthStart, lt: thisMonthStart },
      },
      _sum: { totalCents: true },
    }),
    db.invoice.findMany({
      where: {
        organizationId: orgId,
        status: { in: ['SENT', 'PAID', 'OVERDUE'] },
        issueDate: { gte: twelveWeeksAgo },
      },
      select: { issueDate: true, totalCents: true },
    }),
  ]);

  const thisMonthCents = thisMonth._sum.totalCents ?? 0;
  const lastMonthCents = lastMonth._sum.totalCents ?? 0;

  // Aggregate weekly sparkline
  const weekMap = new Map<string, number>();
  for (const inv of weeklyInvoices) {
    const key = weekLabel(inv.issueDate);
    weekMap.set(key, (weekMap.get(key) ?? 0) + inv.totalCents);
  }
  // Fill last 12 week slots to ensure continuous axis
  const sparkline: { week: string; totalCents: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 7 * 24 * 3600 * 1000);
    const key = weekLabel(d);
    sparkline.push({ week: key, totalCents: weekMap.get(key) ?? 0 });
  }

  return {
    thisMonthCents,
    deltaPercent: safeDeltaPct(thisMonthCents, lastMonthCents),
    currency: 'USD',
    sparkline,
  };
}

export function getRevenueKpi(orgId: string): Promise<RevenueKpi> {
  return unstable_cache(() => _getRevenueKpi(orgId), [`dashboard:revenue:${orgId}`], {
    revalidate: 300,
  })();
}

// ─── Orders KPI ───────────────────────────────────────────────────────────────

async function _getOrderKpi(orgId: string): Promise<OrderKpi> {
  const activeStatuses: ('QUOTED' | 'CONFIRMED' | 'IN_PRODUCTION' | 'QC' | 'SHIPPED')[] = [
    'QUOTED',
    'CONFIRMED',
    'IN_PRODUCTION',
    'QC',
    'SHIPPED',
  ];

  const breakdown = await db.order.groupBy({
    by: ['status'],
    where: { organizationId: orgId, status: { in: activeStatuses } },
    _count: { _all: true },
  });

  const statusBreakdown = breakdown.map((r) => ({ status: r.status, count: r._count._all }));
  const activeCount = statusBreakdown.reduce((s, r) => s + r.count, 0);

  return { activeCount, statusBreakdown };
}

export function getOrderKpi(orgId: string): Promise<OrderKpi> {
  return unstable_cache(() => _getOrderKpi(orgId), [`dashboard:orders:${orgId}`], {
    revalidate: 300,
  })();
}

// ─── Supplier Risk KPI ────────────────────────────────────────────────────────

async function _getSupplierRiskKpi(orgId: string): Promise<SupplierRiskKpi> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

  const [current, prev] = await Promise.all([
    db.supplier.aggregate({
      where: { organizationId: orgId, status: 'ACTIVE', riskScore: { not: null } },
      _avg: { riskScore: true },
      _count: { id: true },
    }),
    // Suppliers updated/created more than 30d ago for trend comparison
    db.supplier.aggregate({
      where: {
        organizationId: orgId,
        status: 'ACTIVE',
        riskScore: { not: null },
        updatedAt: { lt: thirtyDaysAgo },
      },
      _avg: { riskScore: true },
    }),
  ]);

  const avgRisk =
    current._avg.riskScore !== null ? Math.round((current._avg.riskScore ?? 0) * 10) / 10 : null;
  const prevAvgRisk =
    prev._avg.riskScore !== null ? Math.round((prev._avg.riskScore ?? 0) * 10) / 10 : null;

  const deltaPoints =
    avgRisk !== null && prevAvgRisk !== null ? Math.round((avgRisk - prevAvgRisk) * 10) / 10 : null;

  return { avgRisk, deltaPoints, activeCount: current._count.id };
}

export function getSupplierRiskKpi(orgId: string): Promise<SupplierRiskKpi> {
  return unstable_cache(() => _getSupplierRiskKpi(orgId), [`dashboard:risk:${orgId}`], {
    revalidate: 300,
  })();
}

// ─── Margin KPI ───────────────────────────────────────────────────────────────

async function _getMarginKpi(orgId: string): Promise<MarginKpi> {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const [thisMonth, lastMonth] = await Promise.all([
    db.order.aggregate({
      where: {
        organizationId: orgId,
        status: 'DELIVERED',
        marginCents: { not: null },
        deliveredAt: { gte: thisMonthStart },
      },
      _sum: { totalCents: true, marginCents: true },
      _count: { id: true },
    }),
    db.order.aggregate({
      where: {
        organizationId: orgId,
        status: 'DELIVERED',
        marginCents: { not: null },
        deliveredAt: { gte: lastMonthStart, lt: thisMonthStart },
      },
      _sum: { totalCents: true, marginCents: true },
    }),
  ]);

  function pct(totalCents: number | null, marginCents: number | null): number | null {
    if (!totalCents || !marginCents) return null;
    return Math.round((marginCents / totalCents) * 1000) / 10; // 1 decimal
  }

  const marginPct = pct(thisMonth._sum.totalCents, thisMonth._sum.marginCents);
  const lastMonthPct = pct(lastMonth._sum.totalCents, lastMonth._sum.marginCents);
  const deltaPoints =
    marginPct !== null && lastMonthPct !== null
      ? Math.round((marginPct - lastMonthPct) * 10) / 10
      : null;

  return { marginPct, deltaPoints, deliveredCount: thisMonth._count.id };
}

export function getMarginKpi(orgId: string): Promise<MarginKpi> {
  return unstable_cache(() => _getMarginKpi(orgId), [`dashboard:margin:${orgId}`], {
    revalidate: 300,
  })();
}

// ─── Orders pipeline (last 12 weeks, stacked by status) ───────────────────────

async function _getOrdersPipelineData(orgId: string): Promise<PipelineDataPoint[]> {
  const twelveWeeksAgo = new Date(Date.now() - 12 * 7 * 24 * 3600 * 1000);

  const orders = await db.order.findMany({
    where: {
      organizationId: orgId,
      status: { not: 'CANCELLED' },
      createdAt: { gte: twelveWeeksAgo },
    },
    select: { status: true, createdAt: true },
  });

  // Build a map of week-label → status counts
  const buckets = new Map<
    string,
    {
      QUOTED: number;
      CONFIRMED: number;
      IN_PRODUCTION: number;
      QC: number;
      SHIPPED: number;
      DELIVERED: number;
    }
  >();

  // Seed all 12 weeks in order (oldest → newest)
  const weekKeys: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.now() - i * 7 * 24 * 3600 * 1000);
    const key = weekLabel(d);
    if (!buckets.has(key)) {
      buckets.set(key, {
        QUOTED: 0,
        CONFIRMED: 0,
        IN_PRODUCTION: 0,
        QC: 0,
        SHIPPED: 0,
        DELIVERED: 0,
      });
      weekKeys.push(key);
    }
  }

  for (const order of orders) {
    const key = weekLabel(order.createdAt);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    const s = order.status as keyof typeof bucket;
    if (s in bucket) bucket[s]++;
  }

  return weekKeys.map((week) => {
    const b = buckets.get(week) ?? {
      QUOTED: 0,
      CONFIRMED: 0,
      IN_PRODUCTION: 0,
      QC: 0,
      SHIPPED: 0,
      DELIVERED: 0,
    };
    return { week, ...b };
  });
}

export function getOrdersPipelineData(orgId: string): Promise<PipelineDataPoint[]> {
  return unstable_cache(() => _getOrdersPipelineData(orgId), [`dashboard:pipeline:${orgId}`], {
    revalidate: 300,
  })();
}

// ─── Top 5 suppliers by order volume ─────────────────────────────────────────

async function _getTopSuppliersByVolume(orgId: string): Promise<TopSupplierVolume[]> {
  const rows = await db.order.groupBy({
    by: ['supplierId'],
    where: { organizationId: orgId, supplierId: { not: null }, status: { not: 'CANCELLED' } },
    _sum: { totalCents: true },
    _count: { _all: true },
    orderBy: { _sum: { totalCents: 'desc' } },
    take: 5,
  });

  const supplierIds = rows.map((r) => r.supplierId).filter(Boolean) as string[];
  const suppliers = await db.supplier.findMany({
    where: { id: { in: supplierIds }, organizationId: orgId },
    select: { id: true, name: true },
  });
  const nameMap = Object.fromEntries(suppliers.map((s) => [s.id, s.name]));

  return rows
    .filter((r): r is typeof r & { supplierId: string } => r.supplierId !== null)
    .map((r) => ({
      supplierId: r.supplierId,
      supplierName: nameMap[r.supplierId] ?? 'Unknown',
      totalCents: r._sum.totalCents ?? 0,
      orderCount: r._count._all,
    }));
}

export function getTopSuppliersByVolume(orgId: string): Promise<TopSupplierVolume[]> {
  return unstable_cache(
    () => _getTopSuppliersByVolume(orgId),
    [`dashboard:top-suppliers:${orgId}`],
    {
      revalidate: 300,
    },
  )();
}

// ─── Recent activity ──────────────────────────────────────────────────────────

async function _getRecentActivity(orgId: string): Promise<ActivityItem[]> {
  const logs = await db.activityLog.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
    take: 15,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,
      user: { select: { firstName: true, lastName: true, avatarUrl: true } },
    },
  });

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    metadata: log.metadata as Record<string, unknown>,
    createdAt: log.createdAt,
    actorName: log.user
      ? [log.user.firstName, log.user.lastName].filter(Boolean).join(' ') || null
      : null,
    actorAvatar: log.user?.avatarUrl ?? null,
  }));
}

export function getRecentActivity(orgId: string): Promise<ActivityItem[]> {
  return unstable_cache(() => _getRecentActivity(orgId), [`dashboard:activity:${orgId}`], {
    revalidate: 120,
  })();
}

// ─── Empty state check ────────────────────────────────────────────────────────

export async function getOrgEmptyState(orgId: string): Promise<OrgEmptyState> {
  const [supplierCount, orderCount] = await Promise.all([
    db.supplier.count({ where: { organizationId: orgId } }),
    db.order.count({ where: { organizationId: orgId } }),
  ]);
  return { isEmpty: supplierCount === 0 && orderCount === 0, supplierCount, orderCount };
}

// ─── AI Insights (mocked) ─────────────────────────────────────────────────────
// TODO(ai): replace mock with real Anthropic call once API key is funded.
// The real implementation should use DASHBOARD_INSIGHTS_SYSTEM_PROMPT and
// INSIGHTS_TOOL_DEFINITION from @/lib/ai/prompts/dashboard-insights, call
// anthropic.messages.create() with the org's context data, and parse the
// tool_use response through InsightsOutputSchema.

async function _getAiInsights(orgId: string): Promise<Insight[]> {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 3600 * 1000);

  // Gather real data to make mock insights contextual
  const [lateOrders, highestMarginOrder, overdueInvoices, highRiskSuppliers] = await Promise.all([
    db.order.findMany({
      where: {
        organizationId: orgId,
        status: { notIn: ['DELIVERED', 'CANCELLED'] },
        expectedDeliveryAt: { lt: now },
      },
      select: { id: true, orderNumber: true, supplier: { select: { id: true, name: true } } },
      orderBy: { expectedDeliveryAt: 'asc' },
      take: 5,
    }),
    db.order.findFirst({
      where: { organizationId: orgId, status: 'DELIVERED', marginCents: { not: null, gt: 0 } },
      orderBy: { marginCents: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        marginCents: true,
        totalCents: true,
        supplier: { select: { name: true } },
      },
    }),
    db.invoice.aggregate({
      where: { organizationId: orgId, status: 'OVERDUE' },
      _count: { id: true },
      _sum: { totalCents: true, paidCents: true },
    }),
    db.supplier.findMany({
      where: { organizationId: orgId, status: 'ACTIVE', riskScore: { gte: 7 } },
      select: { id: true, name: true, riskScore: true },
      orderBy: { riskScore: 'desc' },
      take: 3,
    }),
  ]);

  void ninetyDaysAgo; // reserved for future real implementation

  const insights: Insight[] = [];

  // Insight 1 — Late orders / supplier risk
  if (lateOrders.length > 0 && lateOrders[0]?.supplier) {
    const supplier = lateOrders[0].supplier;
    const count = lateOrders.length;
    insights.push({
      id: 'late-deliveries',
      type: 'warning',
      title: `${count} order${count > 1 ? 's' : ''} past expected delivery`,
      body: `${supplier.name} has ${count} overdue order${count > 1 ? 's' : ''}. Consider reaching out to confirm production status and update ETAs.`,
      entityType: 'supplier',
      entityId: supplier.id,
      entityLabel: supplier.name,
      ctaLabel: 'View supplier',
      ctaHref: `/suppliers/${supplier.id}`,
    });
  } else if (highRiskSuppliers.length > 0 && highRiskSuppliers[0]) {
    const s = highRiskSuppliers[0];
    insights.push({
      id: 'high-risk-supplier',
      type: 'warning',
      title: `${s.name} has a high risk score`,
      body: `Risk score ${s.riskScore?.toFixed(1)}/10 — above the 7.0 threshold. Run an AI analysis to identify specific red flags before placing new orders.`,
      entityType: 'supplier',
      entityId: s.id,
      entityLabel: s.name,
      ctaLabel: 'Run analysis',
      ctaHref: `/suppliers/${s.id}`,
    });
  }

  // Insight 2 — Highest margin order opportunity
  if (highestMarginOrder && highestMarginOrder.totalCents > 0 && highestMarginOrder.marginCents) {
    const marginPct = Math.round(
      (highestMarginOrder.marginCents / highestMarginOrder.totalCents) * 100,
    );
    insights.push({
      id: 'top-margin-order',
      type: 'opportunity',
      title: `Order #${highestMarginOrder.orderNumber} achieved ${marginPct}% margin`,
      body: `This is your highest-margin delivered order${highestMarginOrder.supplier ? ` from ${highestMarginOrder.supplier.name}` : ''}. Consider negotiating similar terms for repeat orders.`,
      entityType: 'order',
      entityId: highestMarginOrder.id,
      entityLabel: `#${highestMarginOrder.orderNumber}`,
      ctaLabel: 'View order',
      ctaHref: `/orders/${highestMarginOrder.id}`,
    });
  }

  // Insight 3 — Overdue invoices cash flow
  const overdueCount = overdueInvoices._count.id;
  const overdueBalance =
    (overdueInvoices._sum.totalCents ?? 0) - (overdueInvoices._sum.paidCents ?? 0);
  if (overdueCount > 0 && overdueBalance > 0) {
    insights.push({
      id: 'overdue-invoices',
      type: 'warning',
      title: `${overdueCount} overdue invoice${overdueCount > 1 ? 's' : ''} need attention`,
      body: `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(overdueBalance / 100)} outstanding on overdue invoices. Send reminders to protect cash flow.`,
      entityType: 'invoice',
      ctaLabel: 'View invoices',
      ctaHref: `/invoices?status=OVERDUE`,
    });
  }

  // Fallback: generic insight if data is sparse
  if (insights.length === 0) {
    insights.push({
      id: 'onboarding-tip',
      type: 'info',
      title: 'Add supplier risk scores to unlock insights',
      body: 'Run AI intelligence analyses on your suppliers to populate risk scores, quality signals, and get proactive alerts.',
      entityType: 'general',
      ctaLabel: 'Analyse a supplier',
      ctaHref: '/suppliers',
    });
  }

  if (insights.length < 2) {
    insights.push({
      id: 'pipeline-health',
      type: 'info',
      title: 'Track margins on delivered orders',
      body: 'Fill in the margin field on delivered orders to unlock margin trend analysis and identify your most profitable sourcing routes.',
      entityType: 'general',
      ctaLabel: 'View orders',
      ctaHref: '/orders',
    });
  }

  return insights.slice(0, 3);
}

export function getAiInsights(orgId: string): Promise<Insight[]> {
  // 1-hour cache per org — mirrors what the real AI call cadence will be.
  return unstable_cache(() => _getAiInsights(orgId), [`dashboard:ai-insights:${orgId}`], {
    revalidate: 3600,
  })();
}
