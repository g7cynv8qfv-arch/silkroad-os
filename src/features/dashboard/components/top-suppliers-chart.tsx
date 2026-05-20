'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { useRouter } from 'next/navigation';
import { formatCents } from '@/lib/currency';
import type { TopSupplierVolume } from '../queries';

interface TopSuppliersChartProps {
  data: TopSupplierVolume[];
  locale: string;
}

export function TopSuppliersChart({ data, locale }: TopSuppliersChartProps) {
  const router = useRouter();

  if (data.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
        No supplier order data yet.
      </div>
    );
  }

  const maxCents = Math.max(...data.map((d) => d.totalCents));

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 44)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        barSize={20}
      >
        <XAxis type="number" hide domain={[0, maxCents * 1.1]} />
        <YAxis
          type="category"
          dataKey="supplierName"
          width={130}
          tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--accent) / 0.06)' }}
          content={({ active, payload }) => {
            if (!active || !payload?.[0]) return null;
            const row = payload[0].payload as TopSupplierVolume;
            return (
              <div className="rounded-md border border-border bg-surface-1 px-3 py-2 text-xs shadow-md">
                <p className="font-medium text-foreground">{row.supplierName}</p>
                <p className="mt-1 font-mono font-semibold">
                  {formatCents(row.totalCents, 'USD', locale)}
                </p>
                <p className="text-muted-foreground">
                  {row.orderCount} order{row.orderCount !== 1 ? 's' : ''}
                </p>
              </div>
            );
          }}
        />
        <Bar
          dataKey="totalCents"
          radius={[0, 4, 4, 0]}
          cursor="pointer"
          onClick={(payload: TopSupplierVolume) => {
            router.push(`/suppliers/${payload.supplierId}`);
          }}
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.supplierId}
              fill={index === 0 ? 'hsl(var(--accent))' : 'hsl(var(--accent) / 0.45)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
