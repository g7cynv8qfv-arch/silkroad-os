import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Building2, FileSpreadsheet, PlayCircle } from 'lucide-react';

export async function DashboardEmptyState() {
  const t = await getTranslations('dashboard.empty');

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      {/* Illustration — minimal geometric grid pattern */}
      <div
        className="relative mb-8 flex h-32 w-32 items-center justify-center rounded-2xl border border-border bg-surface-1"
        aria-hidden="true"
      >
        {/* Grid of small dots */}
        <div className="absolute inset-4 grid grid-cols-4 grid-rows-4 gap-2">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="rounded-full bg-border"
              style={{ width: 6, height: 6, opacity: 0.4 + (i % 4) * 0.15 }}
            />
          ))}
        </div>
        <Building2 className="relative z-10 h-10 w-10 text-accent" />
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t('title')}</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {t('description')}
      </p>

      {/* CTA row */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="sm">
          <Link href="/suppliers/new">
            <Building2 className="mr-2 h-4 w-4" />
            {t('ctaAddSupplier')}
          </Link>
        </Button>

        <Button asChild variant="outline" size="sm">
          <Link href="/suppliers?import=true">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {t('ctaImportExcel')}
          </Link>
        </Button>

        <Button asChild variant="ghost" size="sm">
          <a
            href="https://silkroute.os/docs/getting-started"
            target="_blank"
            rel="noopener noreferrer"
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            {t('ctaWatchDemo')}
          </a>
        </Button>
      </div>

      {/* Supporting micro-copy */}
      <p className="mt-6 text-xs text-muted-foreground/70">{t('hint')}</p>
    </div>
  );
}
