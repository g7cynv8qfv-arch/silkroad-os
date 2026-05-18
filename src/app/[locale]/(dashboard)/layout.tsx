import { type ReactNode } from 'react';
import { getCurrentOrg } from '@/lib/auth';
import { SidebarProvider } from '@/components/shell/sidebar-context';
import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';
import { ShellCommandPalette } from '@/components/shell/shell-command-palette';
import { ShellMain } from './shell-main';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Defense-in-depth guard — middleware handles the primary redirect.
  // Skipped in local dev without Clerk keys to allow design iteration.
  if (process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY']) {
    await getCurrentOrg();
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <ShellMain>
          <Topbar />
          <main className="flex-1 px-8 py-6">{children}</main>
        </ShellMain>
        <ShellCommandPalette />
      </div>
    </SidebarProvider>
  );
}
