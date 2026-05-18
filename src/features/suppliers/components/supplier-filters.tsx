'use client';

import * as React from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { COUNTRIES } from '@/lib/countries';
import { SUPPLIER_CATEGORIES, SUPPLIER_STATUSES } from '../schemas';
import type { SupplierFilters } from '../schemas';

interface SupplierFiltersProps {
  filters: SupplierFilters;
}

function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  value?: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  className?: string;
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className={`focus-ring flex h-9 rounded-md border border-border bg-surface-1 px-3 py-1.5 text-sm text-foreground disabled:opacity-50 ${className ?? ''}`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function SupplierFilters({ filters }: SupplierFiltersProps) {
  const t = useTranslations('suppliers.list.filters');
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = React.useState(filters.q ?? '');
  const searchTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeFilterCount = [
    filters.country,
    filters.category,
    filters.status,
    filters.ratingMin !== undefined,
    filters.ratingMax !== undefined,
    filters.riskMin !== undefined,
    filters.riskMax !== undefined,
    filters.q,
  ].filter(Boolean).length;

  function pushFilters(updates: Partial<SupplierFilters>) {
    const params = new URLSearchParams(window.location.search);
    const merged = { ...filters, ...updates, page: 1 };

    const keys: (keyof SupplierFilters)[] = [
      'q',
      'country',
      'category',
      'status',
      'ratingMin',
      'ratingMax',
      'riskMin',
      'riskMax',
      'sort',
      'dir',
    ];
    keys.forEach((k) => {
      const val = merged[k];
      if (val !== undefined && val !== '') {
        params.set(k, String(val));
      } else {
        params.delete(k);
      }
    });
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearch(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => pushFilters({ q: val || undefined }), 400);
  }

  function clearAll() {
    setSearch('');
    router.push(pathname);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={handleSearchChange}
          placeholder={t('search')}
          className="w-52 pl-8"
          aria-label={t('search')}
        />
      </div>

      <Select
        value={filters.country}
        onChange={(val) => pushFilters({ country: val || undefined })}
        options={COUNTRIES.map((c) => ({ value: c.code, label: `${c.name}` }))}
        placeholder={t('country')}
        className="w-40"
      />

      <Select
        value={filters.category}
        onChange={(val) => pushFilters({ category: val || undefined })}
        options={SUPPLIER_CATEGORIES.map((c) => ({ value: c, label: c }))}
        placeholder={t('category')}
        className="w-40"
      />

      <Select
        value={filters.status}
        onChange={(val) => pushFilters({ status: (val as SupplierFilters['status']) || undefined })}
        options={SUPPLIER_STATUSES.map((s) => ({
          value: s,
          label: s.charAt(0) + s.slice(1).toLowerCase(),
        }))}
        placeholder={t('status')}
        className="w-36"
      />

      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <X className="h-3.5 w-3.5" />
          {t('clear')}
          <Badge variant="secondary" className="h-4.5 min-w-4.5 ml-1 px-1 text-[10px]">
            {activeFilterCount}
          </Badge>
        </Button>
      )}
    </div>
  );
}
