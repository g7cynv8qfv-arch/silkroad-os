'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Search, X, LayoutList, Columns3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ORDER_STATUSES } from '../schemas';
import type { OrderFilters } from '../types';

const STATUS_LABELS: Record<string, string> = {
  QUOTED: 'Quoted',
  CONFIRMED: 'Confirmed',
  IN_PRODUCTION: 'In production',
  QC: 'QC',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

interface OrderFiltersProps {
  filters: OrderFilters;
}

export function OrderFiltersBar({ filters }: OrderFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  function update(key: string, value: string | null) {
    const p = new URLSearchParams(params.toString());
    if (value) {
      p.set(key, value);
    } else {
      p.delete(key);
    }
    p.delete('page');
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  }

  function clearAll() {
    const p = new URLSearchParams();
    const currentView = params.get('view');
    if (currentView) p.set('view', currentView);
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  }

  const hasActiveFilters = filters.q || filters.status;
  const view = filters.view ?? 'table';

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative min-w-[220px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search orders…"
          defaultValue={filters.q ?? ''}
          onChange={(e) => update('q', e.target.value || null)}
          className="pl-9"
        />
      </div>

      {/* Status filter */}
      <select
        value={filters.status ?? ''}
        onChange={(e) => update('status', e.target.value || null)}
        className="focus-ring h-9 rounded-md border border-border bg-surface-1 px-3 py-1.5 text-sm text-foreground"
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      {/* Clear */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}

      <div className="ml-auto flex items-center gap-1 rounded-md border border-border p-0.5">
        <button
          onClick={() => update('view', 'table')}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded transition-colors',
            view === 'table'
              ? 'bg-surface-2 text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
          aria-label="Table view"
          aria-pressed={view === 'table'}
        >
          <LayoutList className="h-4 w-4" />
        </button>
        <button
          onClick={() => update('view', 'kanban')}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded transition-colors',
            view === 'kanban'
              ? 'bg-surface-2 text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
          aria-label="Kanban view"
          aria-pressed={view === 'kanban'}
        >
          <Columns3 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
