import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '../types';

// ─── Milestone definition ─────────────────────────────────────────────────────

const MILESTONES: { status: OrderStatus; label: string; description: string }[] = [
  { status: 'QUOTED', label: 'Order placed', description: 'Quotation received from supplier' },
  { status: 'CONFIRMED', label: 'Confirmed', description: 'Supplier confirmed the order' },
  {
    status: 'IN_PRODUCTION',
    label: 'In production',
    description: 'Manufacturing has started',
  },
  { status: 'QC', label: 'Quality check', description: 'Pre-shipment inspection' },
  { status: 'SHIPPED', label: 'Shipped', description: 'Order is on its way' },
  { status: 'DELIVERED', label: 'Delivered', description: 'Order received at destination' },
];

const STATUS_INDEX: Record<OrderStatus, number> = {
  QUOTED: 0,
  CONFIRMED: 1,
  IN_PRODUCTION: 2,
  QC: 3,
  SHIPPED: 4,
  DELIVERED: 5,
  CANCELLED: -1,
};

// ─── Activity log entry shape ─────────────────────────────────────────────────

interface TimelineLogEntry {
  action: string;
  metadata: unknown;
  createdAt: Date;
}

function extractDateForStatus(
  status: OrderStatus,
  logs: TimelineLogEntry[],
  createdAt: Date,
  deliveredAt: Date | null,
): Date | null {
  if (status === 'QUOTED') return createdAt;
  if (status === 'DELIVERED') return deliveredAt;
  const entry = logs.find(
    (l) => l.action === 'order.status_changed' && (l.metadata as { to?: string }).to === status,
  );
  return entry?.createdAt ?? null;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface OrderTimelineProps {
  status: OrderStatus;
  createdAt: Date;
  deliveredAt: Date | null;
  logs?: TimelineLogEntry[];
  className?: string;
}

export function OrderTimeline({
  status,
  createdAt,
  deliveredAt,
  logs = [],
  className,
}: OrderTimelineProps) {
  const currentIdx = STATUS_INDEX[status] ?? -1;

  if (status === 'CANCELLED') {
    return (
      <div className={cn('rounded-lg border border-border bg-surface-1 p-4', className)}>
        <p className="text-sm font-medium text-danger">Order cancelled</p>
        <p className="mt-1 text-xs text-muted-foreground">
          This order was cancelled and removed from the active pipeline.
        </p>
      </div>
    );
  }

  return (
    <ol aria-label="Order timeline" className={cn('relative space-y-0', className)}>
      {MILESTONES.map((milestone, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const pending = idx > currentIdx;
        const date = extractDateForStatus(milestone.status, logs, createdAt, deliveredAt);

        return (
          <li key={milestone.status} className="relative flex gap-3 pb-6 last:pb-0">
            {/* Connector line */}
            {idx < MILESTONES.length - 1 && (
              <div
                className={cn(
                  'absolute left-[11px] top-6 h-full w-px',
                  done ? 'bg-accent' : 'bg-border',
                )}
                aria-hidden="true"
              />
            )}

            {/* Icon */}
            <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center">
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-accent" />
              ) : active ? (
                <div className="h-5 w-5 rounded-full border-2 border-accent bg-accent/15" />
              ) : (
                <Circle className="h-5 w-5 text-border" />
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 pt-0.5">
              <p
                className={cn(
                  'text-sm font-medium',
                  done || active ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {milestone.label}
                {active && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                    <Clock className="h-3 w-3" />
                    Current
                  </span>
                )}
              </p>
              <p
                className={cn(
                  'mt-0.5 text-xs',
                  pending ? 'text-muted-foreground/60' : 'text-muted-foreground',
                )}
              >
                {milestone.description}
              </p>
              {date && (
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
