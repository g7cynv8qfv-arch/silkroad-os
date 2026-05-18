'use client';

import * as React from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CountryFlag } from './country-flag';
import { RatingStars } from './rating-stars';
import { RiskBadge } from './risk-badge';
import { archiveSuppliers, exportSuppliersCSV } from '../actions';
import { toast } from 'sonner';
import { Download, Archive } from 'lucide-react';
import type { SupplierListItem } from '../types';
import type { SortDirection } from '@/components/ui/table';

interface SupplierTableProps {
  items: SupplierListItem[];
  sort?: string;
  dir?: string;
}

const STATUS_VARIANT: Record<string, 'success' | 'secondary' | 'danger'> = {
  ACTIVE: 'success',
  ARCHIVED: 'secondary',
  BLACKLISTED: 'danger',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
  BLACKLISTED: 'Blacklisted',
};

type SortColumn = 'name' | 'country' | 'rating' | 'riskScore' | 'createdAt';

export function SupplierTable({ items, sort, dir }: SupplierTableProps) {
  const t = useTranslations('suppliers.list');
  const router = useRouter();
  const pathname = usePathname();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = React.useState(false);

  const allSelected = items.length > 0 && selected.size === items.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((s) => s.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleSort(col: SortColumn) {
    const params = new URLSearchParams(window.location.search);
    const currentSort = params.get('sort');
    const currentDir = params.get('dir');
    const newDir = currentSort === col && currentDir === 'asc' ? 'desc' : 'asc';
    params.set('sort', col);
    params.set('dir', newDir);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  function sortDir(col: SortColumn): SortDirection {
    if (sort !== col) return null;
    return (dir as SortDirection) ?? null;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTableRowElement>, id: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      router.push(`/suppliers/${id}`);
    }
  }

  async function handleBulkArchive() {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const result = await archiveSuppliers(Array.from(selected));
      if (result.success) {
        toast.success(`${selected.size} supplier(s) archived`);
        setSelected(new Set());
      } else {
        toast.error(result.error);
      }
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleExport() {
    setBulkLoading(true);
    try {
      const result = await exportSuppliersCSV();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `suppliers-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-1 px-4 py-2">
          <span className="text-sm text-muted-foreground">{selected.size} selected</span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" loading={bulkLoading} onClick={handleBulkArchive}>
              <Archive className="h-3.5 w-3.5" />
              Archive
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Deselect all
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <tr>
            <TableHead className="w-10">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
            </TableHead>
            <TableHead sortable sortDirection={sortDir('name')} onSort={() => handleSort('name')}>
              {t('columns.name')}
            </TableHead>
            <TableHead
              sortable
              sortDirection={sortDir('country')}
              onSort={() => handleSort('country')}
            >
              {t('columns.country')}
            </TableHead>
            <TableHead>{t('columns.category')}</TableHead>
            <TableHead
              sortable
              sortDirection={sortDir('rating')}
              onSort={() => handleSort('rating')}
            >
              {t('columns.rating')}
            </TableHead>
            <TableHead
              sortable
              sortDirection={sortDir('riskScore')}
              onSort={() => handleSort('riskScore')}
            >
              {t('columns.riskScore')}
            </TableHead>
            <TableHead
              sortable
              sortDirection={sortDir('createdAt')}
              onSort={() => handleSort('createdAt')}
            >
              {t('columns.lastOrder')}
            </TableHead>
            <TableHead>{t('columns.status')}</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {items.map((supplier) => {
            const lastOrder = supplier.orders[0];
            return (
              <TableRow
                key={supplier.id}
                tabIndex={0}
                role="link"
                data-selected={selected.has(supplier.id)}
                onClick={() => router.push(`/suppliers/${supplier.id}`)}
                onKeyDown={(e) => handleKeyDown(e, supplier.id)}
                className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                aria-label={`Open supplier ${supplier.name}`}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selected.has(supplier.id)}
                    onCheckedChange={() => toggleOne(supplier.id)}
                    aria-label={`Select ${supplier.name}`}
                  />
                </TableCell>
                <TableCell>
                  <span className="font-medium text-foreground">{supplier.name}</span>
                  {supplier.city && (
                    <span className="ml-1.5 text-xs text-muted-foreground">{supplier.city}</span>
                  )}
                </TableCell>
                <TableCell>
                  <CountryFlag code={supplier.country} showName />
                </TableCell>
                <TableCell>
                  {supplier.mainCategory ? (
                    <span className="text-sm text-muted-foreground">{supplier.mainCategory}</span>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <RatingStars rating={supplier.rating} />
                </TableCell>
                <TableCell>
                  <RiskBadge score={supplier.riskScore} />
                </TableCell>
                <TableCell>
                  {lastOrder ? (
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {lastOrder.createdAt.toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={STATUS_VARIANT[supplier.status] ?? 'secondary'}
                    className="text-xs"
                  >
                    {STATUS_LABEL[supplier.status] ?? supplier.status}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={handleExport} loading={bulkLoading}>
          <Download className="h-3.5 w-3.5" />
          {t('exportToCsv')}
        </Button>
      </div>
    </div>
  );
}
