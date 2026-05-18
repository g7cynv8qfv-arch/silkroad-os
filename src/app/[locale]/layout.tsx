import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { getMessages } from 'next-intl/server';
import { Providers } from '@/components/shell/providers';
import { routing } from '@/lib/i18n/routing';
import '@/app/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'SilkRoute OS',
    template: '%s · SilkRoute OS',
  },
  description: 'AI-powered sourcing & import/export operating system',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <html
      lang={params.locale}
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers locale={params.locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
