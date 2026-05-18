'use client';

import { useRouter } from '@/lib/i18n/navigation';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SupplierPaginationProps {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
}

export function SupplierPagination({ page, pageCount, total, pageSize }: SupplierPaginationProps) {
  const t = useTranslations('suppliers.list.pagination');
  const router = useRouter();
  const pathname = usePathname();

  function goToPage(p: number) {
    const params = new URLSearchParams(window.location.search);
    params.set('page', String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  const from = Math.min((page - 1) * pageSize + 1, total);
  const to = Math.min(page * pageSize, total);

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 pt-2 text-sm text-muted-foreground">
      <span>{t('showing', { from, to, total })}</span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => goToPage(page - 1)}
          aria-label={t('prev')}
        >
          <ChevronLeft className="h-4 w-4" />
          {t('prev')}
        </Button>

        {Array.from({ length: Math.min(pageCount, 7) }).map((_, i) => {
          let pageNum: number;
          if (pageCount <= 7) {
            pageNum = i + 1;
          } else if (page <= 4) {
            pageNum = i < 6 ? i + 1 : pageCount;
          } else if (page >= pageCount - 3) {
            pageNum = i === 0 ? 1 : pageCount - 6 + i;
          } else {
            const offsets = [0, 1, 2, 3, 4, 5, 6];
            const offset = offsets[i - 1] ?? 0;
            pageNum = i === 0 ? 1 : i === 6 ? pageCount : page - 2 + offset;
          }

          return (
            <Button
              key={i}
              variant={pageNum === page ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => goToPage(pageNum)}
              className="w-9 font-mono tabular-nums"
              aria-current={pageNum === page ? 'page' : undefined}
            >
              {pageNum}
            </Button>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => goToPage(page + 1)}
          aria-label={t('next')}
        >
          {t('next')}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
