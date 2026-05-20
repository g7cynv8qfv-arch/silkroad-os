'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import type { PipelineDataPoint } from '../queries';

// Colors come from CSS variables so dark/light mode works automatically.
const STATUS_CONFIG = [
  { key: 'QUOTED', label: 'Quoted', color: 'hsl(var(--muted-foreground) / 0.5)' },
  { key: 'CONFIRMED', label: 'Confirmed', color: 'hsl(var(--info))' },
  { key: 'IN_PRODUCTION', label: 'In production', color: 'hsl(var(--warning))' },
  { key: 'QC', label: 'QC', color: 'hsl(var(--accent))' },
  { key: 'SHIPPED', label: 'Shipped', color: 'hsl(var(--success) / 0.7)' },
  { key: 'DELIVERED', label: 'Delivered', color: 'hsl(var(--success))' },
] as const;

interface OrdersPipelineChartProps {
  data: PipelineDataPoint[];
}

export function OrdersPipelineChart({ data }: OrdersPipelineChartProps) {
  const hasData = data.some((d) => STATUS_CONFIG.some((s) => d[s.key] > 0));

  if (!hasData) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
        No order data for the last 12 weeks.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={data} margin={{ top: 4, right: 0, left: -24, bottom: 0 }} barSize={10}>
        <XAxis
          dataKey="week"
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          interval={1}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--accent) / 0.06)' }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const total = (payload as { value: number }[]).reduce((s, p) => s + (p.value ?? 0), 0);
            return (
              <div className="rounded-md border border-border bg-surface-1 px-3 py-2 text-xs shadow-md">
                <p className="mb-1.5 font-medium text-foreground">{label as string}</p>
                {payload.map((p) => (
                  <div key={p.dataKey as string} className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: p.fill as string }}
                    />
                    <span className="text-muted-foreground">{p.name as string}</span>
                    <span className="ml-auto font-mono font-medium">{p.value as number}</span>
                  </div>
                ))}
                <div className="mt-1.5 flex items-center justify-between border-t border-border pt-1.5">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-mono font-semibold">{total}</span>
                </div>
              </div>
            );
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
          formatter={(value) => (
            <span style={{ color: 'hsl(var(--muted-foreground))' }}>{value}</span>
          )}
        />
        {STATUS_CONFIG.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            stackId="pipeline"
            fill={s.color}
            radius={s.key === 'DELIVERED' ? [3, 3, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
