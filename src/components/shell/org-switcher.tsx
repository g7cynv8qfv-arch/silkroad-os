'use client';

import * as React from 'react';
import { useOrganization, useOrganizationList, useClerk } from '@clerk/nextjs';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ChevronsUpDown, Plus, Check, LogOut, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface OrgSwitcherProps {
  collapsed?: boolean;
}

// Outer guard — only mounts the Clerk-hook component when ClerkProvider is present
export function OrgSwitcher(props: OrgSwitcherProps) {
  if (!process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY']) {
    return (
      <div className="flex h-9 items-center gap-2 px-2 text-sm font-medium text-muted-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-medium text-accent">
          D
        </span>
        {!props.collapsed && <span className="truncate">Dev org</span>}
      </div>
    );
  }
  return <OrgSwitcherInner {...props} />;
}

function OrgSwitcherInner({ collapsed = false }: OrgSwitcherProps) {
  const { organization } = useOrganization();
  const { userMemberships, setActive } = useOrganizationList({ userMemberships: true });
  const { signOut } = useClerk();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('shell.userMenu');

  const memberships = userMemberships?.data ?? [];
  const initials =
    organization?.name
      ?.split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() ?? '?';

  async function handleSwitch(orgId: string) {
    if (!setActive) return;
    await setActive({ organization: orgId });
    router.refresh();
  }

  async function handleSignOut() {
    await signOut();
    router.push(`/${locale}`);
  }

  const trigger = collapsed ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={organization?.name ?? 'Organization'}>
            <Avatar size="sm">
              {organization?.imageUrl && (
                <AvatarImage src={organization.imageUrl} alt={organization.name ?? ''} />
              )}
              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">{organization?.name ?? 'Organization'}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <Button
      variant="ghost"
      className="h-9 w-full justify-between gap-2 px-2 font-normal"
      aria-label="Switch organization"
    >
      <span className="flex min-w-0 items-center gap-2">
        <Avatar size="sm">
          {organization?.imageUrl && (
            <AvatarImage src={organization.imageUrl} alt={organization.name ?? ''} />
          )}
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-medium">{organization?.name ?? 'Select org'}</span>
      </span>
      <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    </Button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>

      <DropdownMenuContent
        align={collapsed ? 'start' : 'start'}
        side={collapsed ? 'right' : 'bottom'}
        className="w-56"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Organizations
        </DropdownMenuLabel>

        {memberships.map((m) => {
          const isActive = m.organization.id === organization?.id;
          return (
            <DropdownMenuItem
              key={m.organization.id}
              onSelect={() => handleSwitch(m.organization.id)}
              className="gap-2"
            >
              <Avatar size="sm">
                {m.organization.imageUrl && (
                  <AvatarImage src={m.organization.imageUrl} alt={m.organization.name} />
                )}
                <AvatarFallback className="text-[10px]">
                  {m.organization.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate">{m.organization.name}</span>
              <Check
                className={cn('h-3.5 w-3.5 text-accent', isActive ? 'opacity-100' : 'opacity-0')}
              />
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={() => router.push(`/${locale}/onboarding`)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('createOrganization')}
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={() => router.push(`/${locale}/settings/organization`)}
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          {t('organizationSettings')}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={handleSignOut}
          className="gap-2 text-danger focus:bg-danger/10 focus:text-danger"
        >
          <LogOut className="h-4 w-4" />
          {t('signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
