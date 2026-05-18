'use client';

import * as React from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('auth.signIn');

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    setError(null);
    setLoading(true);

    try {
      const result = await signIn.create({ identifier: email, password });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        const returnUrl = searchParams.get('redirect_url') ?? `/${locale}/dashboard`;
        router.push(returnUrl);
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ code?: string }> };
      const code = clerkError.errors?.[0]?.code;
      if (code === 'form_password_incorrect' || code === 'form_identifier_not_found') {
        setError(t('errors.invalidCredentials'));
      } else if (code === 'too_many_requests') {
        setError(t('errors.tooManyAttempts'));
      } else {
        setError(t('errors.generic'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <FormField label={t('emailLabel')} htmlFor="email" error={error ?? undefined}>
            <Input
              id="email"
              type="email"
              placeholder={t('emailPlaceholder')}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>
          <FormField label={t('passwordLabel')} htmlFor="password">
            <Input
              id="password"
              type="password"
              placeholder={t('passwordPlaceholder')}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormField>
          <div className="flex justify-end">
            <a
              href={`/${locale}/forgot-password`}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('forgotPassword')}
            </a>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button type="submit" className="w-full" loading={loading}>
            {t('submitButton')}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t('noAccount')}{' '}
            <a href={`/${locale}/sign-up`} className="font-medium text-accent hover:underline">
              {t('signUpLink')}
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
