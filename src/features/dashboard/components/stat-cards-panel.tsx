import { getTranslations } from 'next-intl/server';
import { StatCard } from '@/components/ui/stat-card';
import { formatCents } from '@/lib/currency';
import { RevenueSparkline } from './revenue-sparkline';
import { getRevenueKpi, getOrderKpi, getSupplierRiskKpi, getMarginKpi } from '../queries';

interface StatCardsPanelProps {
  orgId: string;
  locale: string;
}

export async function StatCardsPanel({ orgId, locale }: StatCardsPanelProps) {
  const t = await getTranslations('dashboard');

  const [revenue, orders, risk, margin] = await Promise.all([
    getRevenueKpi(orgId),
    getOrderKpi(orgId),
    getSupplierRiskKpi(orgId),
    getMarginKpi(orgId),
  ]);

  // Active orders status chip strip
  const STATUS_COLOR: Record<string, string> = {
    QUOTED: 'bg-surface-3 text-muted-foreground',
    CONFIRMED: 'bg-info/15 text-info',
    IN_PRODUCTION: 'bg-warning/15 text-warning',
    QC: 'bg-accent/15 text-accent',
    SHIPPED: 'bg-success/15 text-success',
  };

  const statusChips = (
    <div
      className="flex flex-wrap gap-1"
      role="list"
      aria-label={t('stats.activeOrders.breakdown')}
    >
      {orders.statusBreakdown.map(({ status, count }) => (
        <span
          key={status}
          role="listitem"
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[status] ?? 'bg-surface-2 text-muted-foreground'}`}
        >
          {count} {t(`orderStatus.${status}`)}
        </span>
      ))}
    </div>
  );

  // Risk trend: deltaPoints is change in absolute score, not %
  const riskDelta = risk.deltaPoints !== null ? Math.round(risk.deltaPoints * -10) : undefined; // invert: lower is better

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Revenue this month */}
      <StatCard
        label={t('stats.revenue.label')}
        value={formatCents(revenue.thisMonthCents, revenue.currency, locale)}
        delta={revenue.deltaPercent ?? undefined}
        deltaLabel={t('stats.revenue.deltaLabel')}
        sparkline={<RevenueSparkline data={revenue.sparkline} currency={revenue.currency} />}
      />

      {/* Active orders */}
      <StatCard
        label={t('stats.activeOrders.label')}
        value={new Intl.NumberFormat(locale).format(orders.activeCount)}
        deltaLabel={orders.activeCount > 0 ? t('stats.activeOrders.deltaLabel') : undefined}
        sparkline={orders.statusBreakdown.length > 0 ? statusChips : undefined}
      />

      {/* Avg supplier risk */}
      <StatCard
        label={t('stats.supplierRisk.label')}
        value={
          risk.avgRisk !== null ? `${risk.avgRisk.toFixed(1)}/10` : t('stats.supplierRisk.noData')
        }
        delta={riskDelta}
        deltaLabel={
          risk.avgRisk !== null
            ? t('stats.supplierRisk.deltaLabel', { count: risk.activeCount })
            : undefined
        }
      />

      {/* Margin % */}
      <StatCard
        label={t('stats.margin.label')}
        value={
          margin.marginPct !== null ? `${margin.marginPct.toFixed(1)}%` : t('stats.margin.noData')
        }
        delta={margin.deltaPoints !== null ? Math.round(margin.deltaPoints) : undefined}
        deltaLabel={
          margin.deliveredCount > 0
            ? t('stats.margin.deltaLabel', { count: margin.deliveredCount })
            : undefined
        }
      />
    </div>
  );
}
