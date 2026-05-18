import * as React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  sparkline?: React.ReactNode;
  className?: string;
}

function StatCard({ label, value, delta, deltaLabel, sparkline, className }: StatCardProps) {
  const deltaSign = delta === undefined ? null : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-border bg-surface-1 p-5 shadow-xs',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {deltaSign !== null && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              deltaSign === 'up' && 'bg-success/15 text-success',
              deltaSign === 'down' && 'bg-danger/15 text-danger',
              deltaSign === 'flat' && 'bg-surface-2 text-muted-foreground',
            )}
            aria-label={`${delta && delta > 0 ? '+' : ''}${delta}% ${deltaLabel ?? ''}`}
          >
            {deltaSign === 'up' && <TrendingUp className="h-3 w-3" aria-hidden="true" />}
            {deltaSign === 'down' && <TrendingDown className="h-3 w-3" aria-hidden="true" />}
            {deltaSign === 'flat' && <Minus className="h-3 w-3" aria-hidden="true" />}
            {delta !== undefined && `${delta > 0 ? '+' : ''}${delta}%`}
          </span>
        )}
      </div>
      <p className="font-mono text-3xl font-bold tracking-tight text-foreground" data-mono>
        {value}
      </p>
      {deltaLabel && <p className="text-xs text-muted-foreground">{deltaLabel}</p>}
      {sparkline && <div className="mt-auto">{sparkline}</div>}
    </div>
  );
}

export { StatCard, type StatCardProps };
