'use client';

import { useRouter } from '@/lib/i18n/navigation';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const TABS = [
  'overview',
  'products',
  'documents',
  'orders',
  'quality',
  'notes',
  'intelligence',
] as const;

type Tab = (typeof TABS)[number];

interface SupplierTabsNavProps {
  activeTab: Tab;
}

export function SupplierTabsNav({ activeTab }: SupplierTabsNavProps) {
  const t = useTranslations('suppliers.detail.tabs');
  const router = useRouter();
  const pathname = usePathname();

  function handleTabChange(tab: Tab) {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div
      role="tablist"
      aria-label="Supplier details"
      className="scrollbar-none flex items-center gap-1 overflow-x-auto border-b border-border pb-px"
    >
      {TABS.map((tab) => (
        <button
          key={tab}
          role="tab"
          aria-selected={tab === activeTab}
          onClick={() => handleTabChange(tab)}
          className={cn(
            'focus-ring inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 pb-3 pt-1 text-sm font-medium transition-colors',
            tab === activeTab
              ? 'border-accent text-foreground'
              : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
          )}
        >
          {t(tab)}
        </button>
      ))}
    </div>
  );
}
