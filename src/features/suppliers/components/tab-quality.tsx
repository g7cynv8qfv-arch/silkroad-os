'use client';

import { useTranslations } from 'next-intl';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ShieldCheck } from 'lucide-react';
import type { QualityCheck } from '@prisma/client';

type QcWithOrder = QualityCheck & { order: { orderNumber: string } };

interface TabQualityProps {
  qualityChecks: QcWithOrder[];
}

export function TabQuality({ qualityChecks }: TabQualityProps) {
  const t = useTranslations('suppliers.detail.quality');

  if (qualityChecks.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title={t('empty.title')}
        description={t('empty.description')}
      />
    );
  }

  const chartData = qualityChecks
    .slice()
    .reverse()
    .map((qc) => ({
      date: qc.performedAt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      passed: qc.passed ? 100 : 0,
      defects: qc.defectsFound,
    }));

  const totalPassed = qualityChecks.filter((q) => q.passed).length;
  const passRate = qualityChecks.length > 0 ? totalPassed / qualityChecks.length : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('passRate')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--surface-1))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(v: number) => [`${v}%`, 'Pass']}
              />
              <Line
                type="monotone"
                dataKey="passed"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <div className="rounded-lg border border-border bg-surface-1 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Pass rate
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {(passRate * 100).toFixed(0)}%
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface-1 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Reports
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {qualityChecks.length}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {qualityChecks.map((qc) => (
          <div
            key={qc.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface-1 px-4 py-3"
          >
            <Badge variant={qc.passed ? 'success' : 'danger'} className="shrink-0 text-xs">
              {qc.passed ? 'Pass' : 'Fail'}
            </Badge>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Order {qc.order.orderNumber}</p>
              {qc.notes && <p className="line-clamp-1 text-xs text-muted-foreground">{qc.notes}</p>}
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-xs tabular-nums text-muted-foreground">
                {qc.performedAt.toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              {qc.defectsFound > 0 && (
                <p className="text-xs text-danger">{qc.defectsFound} defects</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
