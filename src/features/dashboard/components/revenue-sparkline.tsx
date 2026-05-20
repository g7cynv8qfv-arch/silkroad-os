'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCents } from '@/lib/currency';

interface RevenueSparklineProps {
  data: { week: string; totalCents: number }[];
  currency: string;
}

export function RevenueSparkline({ data, currency }: RevenueSparklineProps) {
  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          cursor={false}
          content={({ active, payload }) => {
            if (!active || !payload?.[0]) return null;
            return (
              <div className="rounded-md border border-border bg-surface-1 px-2 py-1 text-xs shadow-md">
                <span className="font-mono font-semibold">
                  {formatCents(payload[0].value as number, currency)}
                </span>
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="totalCents"
          stroke="hsl(var(--accent))"
          strokeWidth={1.5}
          fill="url(#sparkGradient)"
          dot={false}
          activeDot={{ r: 3, fill: 'hsl(var(--accent))' }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
