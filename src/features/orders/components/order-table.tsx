'use client';

import { Link } from '@/lib/i18n/navigation';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { OrderStatusPill } from './order-status-pill';
import type { OrderListItem } from '../types';

// ─── Currency formatting ──────────────────────────────────────────────────────

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

// ─── Sort header ──────────────────────────────────────────────────────────────

type SortField = 'orderNumber' | 'totalCents' | 'expectedDeliveryAt' | 'createdAt';

function SortHeader({
  label,
  field,
  current,
  dir,
}: {
  label: string;
  field: SortField;
  current?: string;
  dir?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function handleClick() {
    const newParams = new URLSearchParams(params.toString());
    if (current === field) {
      newParams.set('dir', dir === 'asc' ? 'desc' : 'asc');
    } else {
      newParams.set('sort', field);
      newParams.set('dir', 'desc');
    }
    router.push(`${pathname}?${newParams.toString()}`);
  }

  const Icon = current === field ? (dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
      <Icon className="h-3 w-3" />
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface OrderTableProps {
  items: OrderListItem[];
  sort?: string;
  dir?: string;
}

export function OrderTable({ items, sort, dir }: OrderTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2">
            <th className="px-4 py-3 text-left">
              <SortHeader label="Order #" field="orderNumber" current={sort} dir={dir} />
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
              Supplier
            </th>
            <th className="px-4 py-3 text-left">
              <SortHeader label="Total" field="totalCents" current={sort} dir={dir} />
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
              Status
            </th>
            <th className="px-4 py-3 text-left">
              <SortHeader label="ETA" field="expectedDeliveryAt" current={sort} dir={dir} />
            </th>
            <th className="px-4 py-3 text-left">
              <SortHeader label="Created" field="createdAt" current={sort} dir={dir} />
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((order, idx) => (
            <tr
              key={order.id}
              className={cn(
                'border-b border-border/50 transition-colors last:border-0 hover:bg-surface-2/50',
                idx % 2 === 0 ? 'bg-surface-1' : 'bg-surface-1/50',
              )}
            >
              <td className="px-4 py-3">
                <Link
                  href={`/orders/${order.id}`}
                  className="font-mono text-sm font-medium text-accent transition-colors hover:text-accent/80"
                >
                  {order.orderNumber}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-foreground">
                {order.supplier ? (
                  <Link
                    href={`/suppliers/${order.supplier.id}`}
                    className="transition-colors hover:text-accent"
                  >
                    {order.supplier.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3 font-mono text-sm font-medium text-foreground">
                {formatMoney(order.totalCents, order.currency)}
              </td>
              <td className="px-4 py-3">
                <OrderStatusPill status={order.status} />
              </td>
              <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                {order.expectedDeliveryAt
                  ? order.expectedDeliveryAt.toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </td>
              <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                {order.createdAt.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
