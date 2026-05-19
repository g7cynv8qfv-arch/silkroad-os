'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCents } from '@/lib/currency';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import type { FinanceDashboard } from '../types';

const AGING_COLORS = ['#22c55e', '#f59e0b', '#f97316', '#ef4444'];

interface FinanceDashboardProps {
  data: FinanceDashboard;
}

export function FinanceDashboardPanel({ data }: FinanceDashboardProps) {
  const currency = 'USD';
  const totalRevenue = data.revenueChart.reduce((s, r) => s + r.totalCents, 0);

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Outstanding balance"
          value={formatCents(data.outstandingCents, currency)}
          deltaLabel={data.outstandingCents > 0 ? 'unpaid invoices' : undefined}
        />
        <StatCard
          label="Overdue invoices"
          value={String(data.overdueCount)}
          delta={data.overdueCount > 0 ? data.overdueCount : undefined}
          deltaLabel={data.overdueCount > 0 ? 'requires action' : 'all on time'}
        />
        <StatCard
          label="Revenue (12 months)"
          value={formatCents(totalRevenue, currency)}
          deltaLabel="paid invoices"
        />
        <StatCard
          label="Top clients"
          value={String(data.topClients.length)}
          deltaLabel="by revenue"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue chart */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Revenue (last 12 months)</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Paid invoices only</p>
          </div>
          {data.revenueChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.revenueChart} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'rgba(99,102,241,0.08)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    return (
                      <div className="rounded-md border border-border bg-surface-1 px-3 py-2 text-xs shadow-md">
                        <p className="font-mono font-semibold">
                          {formatCents(payload[0].value as number, currency)}
                        </p>
                        <p className="text-muted-foreground">
                          {payload[0].payload.month as string}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="totalCents" radius={[3, 3, 0, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
              No revenue data yet
            </div>
          )}
        </Card>

        {/* Aging report */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Aging report</h3>
          </div>
          <div className="space-y-3">
            {data.aging.map((bucket, i) => (
              <div key={bucket.bucket} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{bucket.bucket} days past due</span>
                  <div className="text-right">
                    <span className="font-mono font-medium text-foreground">
                      {formatCents(bucket.totalCents, currency)}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">{bucket.count} inv.</span>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${data.outstandingCents > 0 ? Math.min(100, (bucket.totalCents / data.outstandingCents) * 100) : 0}%`,
                      backgroundColor: AGING_COLORS[i] ?? '#6366f1',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top clients */}
      {data.topClients.length > 0 && (
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Top clients by revenue</h3>
          </div>
          <div className="space-y-3">
            {data.topClients.map((client, i) => (
              <div key={client.clientId} className="flex items-center gap-4">
                <span className="w-5 text-center font-mono text-xs font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {client.clientName}
                  </p>
                  <p className="text-xs text-muted-foreground">{client.invoiceCount} invoices</p>
                </div>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {formatCents(client.totalCents, currency)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
