import { type ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentOrg } from '@/lib/auth';
import { SidebarProvider } from '@/components/shell/sidebar-context';
import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';
import { ShellCommandPalette } from '@/components/shell/shell-command-palette';
import { ShellMain } from './shell-main';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  // Primary org guard: the middleware does NOT check orgId on dashboard routes
  // because doing so would block Clerk's JWT handshake (which exchanges the
  // updated __clerk_db_jwt for a fresh __session after setActive). The layout
  // runs after that handshake completes and sees the correct auth state.
  if (process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY']) {
    try {
      await getCurrentOrg();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('no active organization') || msg.includes('Unauthorized')) {
        redirect(`/${params.locale}/onboarding`);
      }
      throw err;
    }
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
