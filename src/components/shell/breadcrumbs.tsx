'use client';

import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';

const LABEL_KEYS: Record<string, string> = {
  dashboard: 'shell.breadcrumbs.dashboard',
  suppliers: 'shell.breadcrumbs.suppliers',
  intelligence: 'shell.breadcrumbs.intelligence',
  orders: 'shell.breadcrumbs.orders',
  invoices: 'shell.breadcrumbs.invoices',
  analytics: 'shell.breadcrumbs.analytics',
  settings: 'shell.breadcrumbs.settings',
  new: 'shell.breadcrumbs.new',
  edit: 'shell.breadcrumbs.edit',
};

// Looks like a cuid/uuid — show truncated ID
function isId(segment: string) {
  return /^[a-z0-9]{20,}$/i.test(segment) || /^[0-9a-f-]{32,}$/i.test(segment);
}

export function Breadcrumbs() {
  const pathname = usePathname(); // locale-stripped, e.g. /suppliers/123/edit
  const t = useTranslations();

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    const key = LABEL_KEYS[seg];
    const label = key ? t(key as Parameters<typeof t>[0]) : isId(seg) ? seg.slice(0, 8) + '…' : seg;
    return { label, href, isLast: i === segments.length - 1 };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      {crumbs.map((crumb, i) => (
        <React.Fragment key={crumb.href}>
          {i > 0 && (
            <ChevronRight
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          )}
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className={cn(
                'text-muted-foreground transition-colors hover:text-foreground',
                'focus-visible:underline focus-visible:outline-none',
              )}
            >
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
