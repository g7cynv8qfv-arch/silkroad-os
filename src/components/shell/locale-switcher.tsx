'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/lib/i18n/routing';

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('shell.locale');

  function handleSwitch() {
    const next: Locale = locale === 'fr' ? 'en' : 'fr';
    router.replace(pathname, { locale: next });
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSwitch}
            aria-label={t('label')}
            className="font-mono text-xs font-semibold tracking-wide text-muted-foreground hover:text-foreground"
          >
            {locale.toUpperCase()}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('switchTo')}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
