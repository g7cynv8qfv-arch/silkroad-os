'use client';

import * as React from 'react';
import { useRouter } from '@/lib/i18n/navigation';

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  cmdOpen: boolean;
  setCmdOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}

const G_SHORTCUTS: Record<string, string> = {
  d: '/dashboard',
  s: '/suppliers',
  i: '/intelligence',
  o: '/orders',
  v: '/invoices',
  a: '/analytics',
};

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);
  const router = useRouter();

  // Hydrate collapse state from localStorage after mount (avoids SSR mismatch)
  React.useEffect(() => {
    const stored = localStorage.getItem('silkroute:sidebar-collapsed');
    if (stored === 'true') setCollapsed(true);
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem('silkroute:sidebar-collapsed', String(collapsed));
  }, [collapsed, hydrated]);

  // Global keyboard shortcuts
  React.useEffect(() => {
    let gActive = false;
    let gTimer: ReturnType<typeof setTimeout>;

    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const inInput =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;

      // ⌘K — command palette (⌘K is also handled in command-palette.tsx but we own it here)
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
        return;
      }

      // ⌘B — toggle sidebar
      if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCollapsed((prev) => !prev);
        return;
      }

      if (inInput) return;

      // G-sequence navigation shortcuts
      if (gActive) {
        clearTimeout(gTimer);
        gActive = false;
        const path = G_SHORTCUTS[e.key.toLowerCase()];
        if (path) {
          e.preventDefault();
          router.push(path);
        }
        return;
      }

      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        gActive = true;
        gTimer = setTimeout(() => {
          gActive = false;
        }, 1000);
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      clearTimeout(gTimer);
    };
  }, [router]);

  return (
    <SidebarContext.Provider
      value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen, cmdOpen, setCmdOpen }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
