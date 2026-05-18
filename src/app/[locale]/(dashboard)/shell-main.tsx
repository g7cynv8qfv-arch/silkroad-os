'use client';

import * as React from 'react';
import { useSidebar } from '@/components/shell/sidebar-context';
import { cn } from '@/lib/utils';

export function ShellMain({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div
      className={cn(
        'flex min-h-screen flex-1 flex-col',
        'transition-[padding-left] duration-200 ease-out',
        // Desktop: offset for fixed sidebar; mobile: no offset (sidebar is in Sheet)
        collapsed ? 'lg:pl-16' : 'lg:pl-64',
      )}
    >
      {children}
    </div>
  );
}
