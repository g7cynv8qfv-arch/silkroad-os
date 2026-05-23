'use client';

import { motion } from 'framer-motion';
import { SignIn } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

const ORBS: Array<{
  className: string;
  animate: { x: number[]; y: number[] };
  duration: number;
}> = [
  {
    className:
      'absolute top-[-20%] left-[-10%] h-[700px] w-[700px] rounded-full bg-indigo-600/20 blur-[140px]',
    animate: { x: [0, 40, -20, 0], y: [0, -30, 20, 0] },
    duration: 20,
  },
  {
    className:
      'absolute top-[5%] right-[-10%] h-[600px] w-[600px] rounded-full bg-blue-500/20 blur-[120px]',
    animate: { x: [0, -30, 15, 0], y: [0, 50, -20, 0] },
    duration: 17,
  },
  {
    className:
      'absolute bottom-[-15%] left-[25%] h-[500px] w-[500px] rounded-full bg-cyan-600/15 blur-[130px]',
    animate: { x: [0, 20, -30, 10, 0], y: [0, -25, 10, -5, 0] },
    duration: 25,
  },
];

interface HomeSceneProps {
  locale: string;
}

export function HomeScene({ locale }: HomeSceneProps) {
  const t = useTranslations('landing');
  const hasClerk = !!process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'];

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#030712' }}>
      {/* Aurora orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {ORBS.map((orb, i) => (
          <motion.div
            key={i}
            className={orb.className}
            animate={orb.animate}
            transition={{ duration: orb.duration, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Film grain overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.04,
        }}
      />

      {/* Main content */}
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-10 px-4 py-16">
        {/* Wordmark + heading */}
        <motion.header
          className="text-center"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-400">
            SilkRoute OS
          </span>
          <h1 className="mt-3 font-sans text-4xl font-bold tracking-tight text-white md:text-[2.75rem] md:leading-[1.15]">
            {t('headline')}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-zinc-400">
            {t('subline')}
          </p>
        </motion.header>

        {/* Auth panel */}
        <motion.div
          data-testid="clerk-panel"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
          className="w-full max-w-[22rem]"
        >
          {hasClerk ? (
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-[0_0_0_1px_rgba(99,102,241,0.08),0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
              <SignIn
                routing="hash"
                signUpUrl={`/${locale}/sign-up`}
                fallbackRedirectUrl={`/${locale}/dashboard`}
                afterSignInUrl={`/${locale}/dashboard`}
                appearance={{
                  variables: {
                    colorBackground: 'transparent',
                    colorInputBackground: 'rgba(255,255,255,0.06)',
                    colorInputText: '#f4f4f5',
                    colorText: '#f4f4f5',
                    colorTextSecondary: '#a1a1aa',
                    colorPrimary: '#6366f1',
                    colorNeutral: '#71717a',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-inter, system-ui, sans-serif)',
                  },
                  elements: {
                    rootBox: { width: '100%', minWidth: 'unset' },
                    cardBox: { width: '100%', minWidth: 'unset' },
                    card: {
                      boxShadow: 'none',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 0,
                      padding: '1.25rem',
                      width: '100%',
                      minWidth: 'unset',
                      boxSizing: 'border-box',
                    },
                    headerTitle: { color: '#f4f4f5' },
                    headerSubtitle: { color: '#a1a1aa' },
                    dividerLine: { backgroundColor: 'rgba(255,255,255,0.08)' },
                    dividerText: { color: '#52525b' },
                    footerAction: { color: '#a1a1aa' },
                    footerActionLink: { color: '#818cf8' },
                    identityPreviewText: { color: '#f4f4f5' },
                    formButtonPrimary: {
                      backgroundColor: '#6366f1',
                      fontFamily: 'var(--font-inter, system-ui)',
                    },
                    formFieldLabel: { color: '#d4d4d8' },
                    formFieldInput: {
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#f4f4f5',
                    },
                    formFieldInputShowPasswordButton: { color: '#a1a1aa' },
                    alert: { backgroundColor: 'rgba(239,68,68,0.1)' },
                  },
                }}
              />
            </div>
          ) : (
            /* Fallback for local dev without Clerk keys */
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
              <p className="mb-6 text-center text-sm text-zinc-400">
                Configure Clerk keys to enable authentication.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href={`/${locale}/sign-up`}
                  className="flex h-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
                >
                  {t('signUp')}
                </Link>
                <Link
                  href={`/${locale}`}
                  className="flex h-10 items-center justify-center rounded-lg border border-white/10 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5"
                >
                  {t('signIn')}
                </Link>
              </div>
            </div>
          )}
        </motion.div>

        {/* Footer note */}
        <motion.p
          className="text-center text-xs text-zinc-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          aria-label={t('footer')}
        >
          {t('footer')}
        </motion.p>
      </div>
    </div>
  );
}
