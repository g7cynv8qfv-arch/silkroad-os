import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '../types';

const pill = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
  {
    variants: {
      status: {
        QUOTED: 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20',
        CONFIRMED: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
        IN_PRODUCTION: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
        QC: 'bg-purple-500/10 text-purple-400 ring-purple-500/20',
        SHIPPED: 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/20',
        DELIVERED: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
        CANCELLED: 'bg-red-500/10 text-red-400 ring-red-500/20',
      },
    },
  },
);

const DOT_CLASSES: Record<OrderStatus, string> = {
  QUOTED: 'bg-zinc-400',
  CONFIRMED: 'bg-blue-400',
  IN_PRODUCTION: 'bg-amber-400',
  QC: 'bg-purple-400',
  SHIPPED: 'bg-indigo-400',
  DELIVERED: 'bg-emerald-400',
  CANCELLED: 'bg-red-400',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  QUOTED: 'Quoted',
  CONFIRMED: 'Confirmed',
  IN_PRODUCTION: 'In production',
  QC: 'QC',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

interface OrderStatusPillProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusPill({ status, className }: OrderStatusPillProps) {
  return (
    <span className={cn(pill({ status }), className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', DOT_CLASSES[status])} aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
