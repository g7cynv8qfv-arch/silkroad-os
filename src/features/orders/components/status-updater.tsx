'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderStatusPill } from './order-status-pill';
import { updateOrderStatus } from '../actions';
import { STATUS_TRANSITIONS } from '../schemas';
import type { OrderStatus } from '../types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  QUOTED: 'Quoted',
  CONFIRMED: 'Confirmed',
  IN_PRODUCTION: 'In production',
  QC: 'QC',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

interface StatusUpdaterProps {
  orderId: string;
  currentStatus: OrderStatus;
}

export function StatusUpdater({ orderId, currentStatus }: StatusUpdaterProps) {
  const [open, setOpen] = React.useState(false);
  const [optimisticStatus, setOptimisticStatus] = React.useState(currentStatus);
  const [pending, setPending] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const allowed = (STATUS_TRANSITIONS[optimisticStatus] ?? []) as OrderStatus[];

  React.useEffect(() => {
    setOptimisticStatus(currentStatus);
  }, [currentStatus]);

  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  async function handleTransition(newStatus: OrderStatus) {
    setOpen(false);
    const prev = optimisticStatus;
    setOptimisticStatus(newStatus);
    setPending(true);
    try {
      const result = await updateOrderStatus(orderId, newStatus);
      if (!result.success) {
        setOptimisticStatus(prev);
        toast.error(result.error);
      } else {
        toast.success(`Status updated to ${STATUS_LABELS[newStatus]}`);
      }
    } finally {
      setPending(false);
    }
  }

  if (allowed.length === 0) {
    return <OrderStatusPill status={optimisticStatus} />;
  }

  return (
    <div ref={ref} className="relative inline-block">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className="gap-1 p-1"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <OrderStatusPill status={optimisticStatus} />
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>

      {open && (
        <div
          role="listbox"
          aria-label="Update status"
          className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-border bg-surface-1 py-1 shadow-lg"
        >
          {allowed.map((status) => (
            <button
              key={status}
              role="option"
              aria-selected={false}
              onClick={() => handleTransition(status)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-surface-2"
            >
              <OrderStatusPill status={status} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
