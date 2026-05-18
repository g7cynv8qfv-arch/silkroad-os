'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const CYCLE: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const t = useTranslations('shell.theme');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" aria-label="Toggle theme" disabled />;
  }

  const current = (theme as 'light' | 'dark' | 'system') ?? 'dark';
  const idx = CYCLE.indexOf(current);
  const next = CYCLE[(idx + 1) % CYCLE.length] ?? 'system';

  const labels: Record<typeof next, string> = {
    light: t('light'),
    dark: t('dark'),
    system: t('system'),
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(next)}
            aria-label={labels[next]}
          >
            {current === 'light' && <Sun className="h-4 w-4" />}
            {current === 'dark' && <Moon className="h-4 w-4" />}
            {current === 'system' && <Monitor className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{labels[next]}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export { ThemeToggle };
