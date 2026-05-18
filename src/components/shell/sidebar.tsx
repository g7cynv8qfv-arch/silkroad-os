'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { PRIMARY_NAV, SECONDARY_NAV } from '@/lib/nav';
import { OrgSwitcher } from './org-switcher';
import { useSidebar } from './sidebar-context';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const SIDEBAR_W_EXPANDED = 256;
const SIDEBAR_W_COLLAPSED = 64;

/* ── Nav item ────────────────────────────────────────────────────────────────── */

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  collapsed: boolean;
  active: boolean;
  onClick?: () => void;
}

function NavItemRow({
  href,
  icon: Icon,
  label,
  shortcut,
  collapsed,
  active,
  onClick,
}: NavItemProps) {
  const inner = (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'group relative flex h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
        active
          ? 'bg-accent/10 text-accent'
          : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
        // Active left-border accent
        active &&
          'before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-r-full before:bg-accent',
        collapsed ? 'w-9 justify-center px-0' : 'w-full',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0',
          active ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground',
        )}
      />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            key="label"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="flex flex-1 items-center justify-between overflow-hidden whitespace-nowrap"
          >
            {label}
            {shortcut && (
              <span className="ml-auto font-mono text-[10px] tracking-widest text-muted-foreground/60">
                {shortcut}
              </span>
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );

  if (!collapsed) return inner;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{inner}</TooltipTrigger>
      <TooltipContent side="right" className="flex items-center gap-2">
        {label}
        {shortcut && (
          <span className="font-mono text-[10px] text-muted-foreground/70">{shortcut}</span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

/* ── Sidebar content (shared between desktop and mobile Sheet) ────────────────── */

interface SidebarContentProps {
  collapsed: boolean;
  pathname: string;
  t: ReturnType<typeof useTranslations>;
  onNavClick?: () => void;
}

function SidebarContent({ collapsed, pathname, t, onNavClick }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo + org switcher */}
      <div
        className={cn(
          'flex h-14 shrink-0 items-center border-b border-border',
          collapsed ? 'justify-center px-0' : 'gap-2 px-3',
        )}
      >
        {collapsed ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <span className="font-mono text-[11px] font-black leading-none">SR</span>
          </div>
        ) : (
          <>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <span className="font-mono text-[11px] font-black leading-none">SR</span>
            </div>
            <span className="font-mono text-sm font-bold tracking-tight text-foreground">
              SilkRoute OS
            </span>
          </>
        )}
      </div>

      {/* Org switcher */}
      <div
        className={cn(
          'shrink-0 border-b border-border',
          collapsed ? 'flex justify-center py-2' : 'px-3 py-2',
        )}
      >
        <OrgSwitcher collapsed={collapsed} />
      </div>

      {/* Primary nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
        <TooltipProvider delayDuration={0}>
          {PRIMARY_NAV.map((item) => (
            <NavItemRow
              key={item.key}
              href={item.href}
              icon={item.icon}
              label={t(item.labelKey as Parameters<typeof t>[0])}
              shortcut={item.shortcut}
              collapsed={collapsed}
              active={pathname === item.href || pathname.startsWith(item.href + '/')}
              onClick={onNavClick}
            />
          ))}
        </TooltipProvider>
      </nav>

      {/* Secondary nav */}
      <div className="shrink-0 border-t border-border px-2 py-3">
        <TooltipProvider delayDuration={0}>
          <div className="flex flex-col gap-0.5">
            {SECONDARY_NAV.map((item) => (
              <NavItemRow
                key={item.key}
                href={item.href}
                icon={item.icon}
                label={t(item.labelKey as Parameters<typeof t>[0])}
                collapsed={collapsed}
                active={pathname === item.href || pathname.startsWith(item.href + '/')}
                onClick={onNavClick}
              />
            ))}
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}

/* ── Sidebar (desktop + mobile) ──────────────────────────────────────────────── */

export function Sidebar() {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <motion.aside
        className="fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-surface-1 lg:flex"
        initial={false}
        animate={{ width: collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <SidebarContent collapsed={collapsed} pathname={pathname} t={t} />

        {/* Collapse toggle button */}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className={cn(
            'absolute -right-3 top-[3.5rem] flex h-6 w-6 items-center justify-center',
            'rounded-full border border-border bg-surface-2 text-muted-foreground shadow-xs',
            'hover:bg-surface-3 hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
            'transition-colors duration-150',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-3 w-3" />
          ) : (
            <PanelLeftClose className="h-3 w-3" />
          )}
        </button>
      </motion.aside>

      {/* ── Mobile Sheet ── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent
            collapsed={false}
            pathname={pathname}
            t={t}
            onNavClick={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
