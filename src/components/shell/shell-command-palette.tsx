'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { toast } from '@/components/ui/toast';
import {
  CommandPalette,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command-palette';
import { useSidebar } from './sidebar-context';
import { PRIMARY_NAV } from '@/lib/nav';

export function ShellCommandPalette() {
  const { cmdOpen, setCmdOpen } = useSidebar();
  const router = useRouter();
  const t = useTranslations('shell.commandPalette');
  const tNav = useTranslations('shell.nav');

  function navigate(href: string) {
    setCmdOpen(false);
    router.push(href);
  }

  function action(label: string) {
    setCmdOpen(false);
    toast.info(`${label} — coming soon.`);
  }

  return (
    <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} placeholder={t('placeholder')}>
      <CommandList>
        <CommandEmpty>{t('noResults')}</CommandEmpty>

        <CommandGroup heading={t('navigation')}>
          {PRIMARY_NAV.map((item) => (
            <CommandItem key={item.key} onSelect={() => navigate(item.href)}>
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span>{tNav(item.key as Parameters<typeof tNav>[0])}</span>
              {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading={t('actions')}>
          <CommandItem onSelect={() => action(t('createSupplier'))}>
            {t('createSupplier')}
          </CommandItem>
          <CommandItem onSelect={() => action(t('createOrder'))}>{t('createOrder')}</CommandItem>
          <CommandItem onSelect={() => action(t('createInvoice'))}>
            {t('createInvoice')}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandPalette>
  );
}
