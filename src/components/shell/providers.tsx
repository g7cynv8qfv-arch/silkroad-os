'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { type AbstractIntlMessages, NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toast';

interface ProvidersProps {
  children: React.ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
}

export function Providers({ children, locale, messages }: ProvidersProps) {
  const inner = (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Europe/Paris">
      <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
        {children}
        <Toaster />
      </ThemeProvider>
    </NextIntlClientProvider>
  );

  // ClerkProvider requires NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.
  // Without it the app renders without auth context (fine for local dev before Clerk is configured).
  if (!process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY']) return inner;

  return <ClerkProvider>{inner}</ClerkProvider>;
}
