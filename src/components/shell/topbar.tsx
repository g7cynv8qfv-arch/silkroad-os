'use client';

import * as React from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Menu, Search, Bell, Settings, User, LogOut } from 'lucide-react';
import { Breadcrumbs } from './breadcrumbs';
import { ThemeToggle } from './theme-toggle';
import { LocaleSwitcher } from './locale-switcher';
import { useSidebar } from './sidebar-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Demo: replace with real unread count from DB/realtime
const UNREAD_COUNT = 0;

function UserMenu() {
  if (!process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY']) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-medium text-accent">
        D
      </div>
    );
  }
  return <UserMenuInner />;
}

function UserMenuInner() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('shell.userMenu');

  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  async function handleSignOut() {
    await signOut();
    router.push(`/${locale}`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus-ring rounded-full" aria-label="User menu">
          <Avatar size="sm">
            {user?.imageUrl && <AvatarImage src={user.imageUrl} alt={user.fullName ?? ''} />}
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-foreground">{user?.fullName ?? 'User'}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress ?? ''}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={() => router.push(`/${locale}/settings/profile`)}
          className="gap-2"
        >
          <User className="h-4 w-4" /> {t('profile')}
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={() => router.push(`/${locale}/settings`)} className="gap-2">
          <Settings className="h-4 w-4" /> {t('settings')}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={handleSignOut}
          className="gap-2 text-danger focus:bg-danger/10 focus:text-danger"
        >
          <LogOut className="h-4 w-4" /> {t('signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationBell() {
  const t = useTranslations('shell.topbar');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('notifications')} className="relative">
          <Bell className="h-4 w-4" />
          {UNREAD_COUNT > 0 && (
            <Badge
              variant="danger"
              className="absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full px-1 text-[10px]"
            >
              {UNREAD_COUNT > 9 ? '9+' : UNREAD_COUNT}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <p className="text-sm font-semibold text-foreground">{t('notifications')}</p>
        <p className="mt-4 text-center text-sm text-muted-foreground">{t('noNotifications')}</p>
      </PopoverContent>
    </Popover>
  );
}

export function Topbar() {
  const { setMobileOpen, setCmdOpen } = useSidebar();
  const t = useTranslations('shell.topbar');

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
      {/* Hamburger — mobile only */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label={t('openMenu')}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Logo — mobile only (sidebar hidden on mobile) */}
      <span className="font-mono text-sm font-bold tracking-tight text-foreground lg:hidden">
        SR
      </span>

      {/* Breadcrumbs — desktop only */}
      <div className="hidden flex-1 lg:flex">
        <Breadcrumbs />
      </div>

      {/* Spacer on mobile */}
      <div className="flex-1 lg:hidden" />

      {/* Right actions */}
      <TooltipProvider>
        <div className="flex items-center gap-1">
          {/* Search shortcut */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCmdOpen(true)}
                aria-label={t('openSearch')}
              >
                <Search className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('openSearch')}{' '}
              <kbd className="ml-1 rounded border border-border bg-surface-2 px-1 py-0.5 font-mono text-[10px]">
                ⌘K
              </kbd>
            </TooltipContent>
          </Tooltip>

          <NotificationBell />
          <ThemeToggle />
          <LocaleSwitcher />
          <UserMenu />
        </div>
      </TooltipProvider>
    </header>
  );
}
