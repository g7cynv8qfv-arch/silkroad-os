import {
  LayoutDashboard,
  Building2,
  Sparkles,
  PackageOpen,
  FileText,
  Users,
  BarChart2,
  Settings,
  HelpCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  key: string;
  href: string;
  icon: LucideIcon;
  labelKey: string;
  shortcut?: string;
}

export const PRIMARY_NAV: NavItem[] = [
  {
    key: 'dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    labelKey: 'shell.nav.dashboard',
    shortcut: 'G D',
  },
  {
    key: 'suppliers',
    href: '/suppliers',
    icon: Building2,
    labelKey: 'shell.nav.suppliers',
    shortcut: 'G S',
  },
  {
    key: 'intelligence',
    href: '/intelligence',
    icon: Sparkles,
    labelKey: 'shell.nav.intelligence',
    shortcut: 'G I',
  },
  {
    key: 'orders',
    href: '/orders',
    icon: PackageOpen,
    labelKey: 'shell.nav.orders',
    shortcut: 'G O',
  },
  {
    key: 'invoices',
    href: '/invoices',
    icon: FileText,
    labelKey: 'shell.nav.invoices',
    shortcut: 'G V',
  },
  {
    key: 'clients',
    href: '/clients',
    icon: Users,
    labelKey: 'shell.nav.clients',
    shortcut: 'G C',
  },
  {
    key: 'analytics',
    href: '/analytics',
    icon: BarChart2,
    labelKey: 'shell.nav.analytics',
    shortcut: 'G A',
  },
];

export const SECONDARY_NAV: NavItem[] = [
  { key: 'settings', href: '/settings', icon: Settings, labelKey: 'shell.nav.settings' },
  { key: 'help', href: '/help', icon: HelpCircle, labelKey: 'shell.nav.help' },
];
