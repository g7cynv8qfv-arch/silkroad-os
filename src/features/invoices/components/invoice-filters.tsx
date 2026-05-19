'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { InvoiceFilters } from '../schemas';

const STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SENT', label: 'Sent' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const TYPES = [
  { value: '', label: 'All types' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'PROFORMA', label: 'Proforma' },
  { value: 'CREDIT_NOTE', label: 'Credit note' },
];

interface InvoiceFiltersBarProps {
  filters: InvoiceFilters;
}

export function InvoiceFiltersBar({ filters }: InvoiceFiltersBarProps) {
  const router = useRouter();
  const sp = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(sp.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete('page');
      router.push(`?${params.toString()}`);
    },
    [router, sp],
  );

  const clear = () => {
    const params = new URLSearchParams();
    if (filters.tab !== 'invoices') params.set('tab', filters.tab);
    router.push(`?${params.toString()}`);
  };

  const hasFilters = filters.q || filters.status || filters.type;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Search invoice or client…"
        defaultValue={filters.q ?? ''}
        className="w-60"
        onChange={(e) => update('q', e.target.value)}
      />

      <select
        className="h-9 rounded-md border border-border bg-surface-1 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
        value={filters.status ?? ''}
        onChange={(e) => update('status', e.target.value)}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        className="h-9 rounded-md border border-border bg-surface-1 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
        value={filters.type ?? ''}
        onChange={(e) => update('type', e.target.value)}
      >
        {TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clear}>
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
