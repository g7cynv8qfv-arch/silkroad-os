'use client';

import { useTheme } from 'next-themes';
import { Toaster as SonnerToaster } from 'sonner';

function Toaster() {
  const { theme } = useTheme();
  return (
    <SonnerToaster
      theme={theme as 'light' | 'dark' | 'system' | undefined}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast bg-surface-2 text-foreground border border-border shadow-md rounded-lg font-sans text-sm',
          description: 'text-muted-foreground',
          actionButton:
            'bg-accent text-accent-foreground rounded-md px-3 py-1.5 text-xs font-medium',
          cancelButton: 'bg-surface-3 text-foreground rounded-md px-3 py-1.5 text-xs font-medium',
          error: 'bg-danger/10 border-danger/30 text-danger',
          success: 'bg-success/10 border-success/30 text-success',
          warning: 'bg-warning/10 border-warning/30 text-warning',
          info: 'bg-info/10 border-info/30 text-info',
        },
      }}
    />
  );
}

export { Toaster };
export { toast } from 'sonner';
