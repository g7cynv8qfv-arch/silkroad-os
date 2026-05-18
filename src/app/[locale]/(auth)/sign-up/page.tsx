'use client';

import * as React from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
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

type Step = 'register' | 'verify';

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('auth.signUp');

  const [step, setStep] = React.useState<Step>('register');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    setError(null);
    setLoading(true);

    try {
      await signUp.create({ firstName, lastName, emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verify');
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ code?: string }> };
      const code = clerkError.errors?.[0]?.code;
      if (code === 'form_identifier_exists') {
        setError(t('errors.emailTaken'));
      } else if (code === 'form_password_pwned') {
        setError(t('errors.weakPassword'));
      } else {
        setError(t('errors.generic'));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    setError(null);
    setLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push(`/${locale}/onboarding`);
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ code?: string }> };
      const errCode = clerkError.errors?.[0]?.code;
      if (errCode === 'form_code_incorrect' || errCode === 'verification_expired') {
        setError(t('errors.invalidCode'));
      } else {
        setError(t('errors.generic'));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!isLoaded) return;
    await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
  }

  if (step === 'verify') {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t('verifyTitle')}</CardTitle>
          <CardDescription>{t('verifySubtitle').replace('{email}', email)}</CardDescription>
        </CardHeader>
        <form onSubmit={handleVerify}>
          <CardContent className="space-y-4">
            <FormField label={t('codeLabel')} htmlFor="code" error={error ?? undefined}>
              <Input
                id="code"
                placeholder={t('codePlaceholder')}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </FormField>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" loading={loading}>
              {t('verifyButton')}
            </Button>
            <button
              type="button"
              onClick={handleResend}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('resendCode')}
            </button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleRegister}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('firstNameLabel')} htmlFor="firstName">
              <Input
                id="firstName"
                placeholder={t('firstNamePlaceholder')}
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </FormField>
            <FormField label={t('lastNameLabel')} htmlFor="lastName">
              <Input
                id="lastName"
                placeholder={t('lastNamePlaceholder')}
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </FormField>
          </div>
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
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormField>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button type="submit" className="w-full" loading={loading}>
            {t('submitButton')}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t('hasAccount')}{' '}
            <a href={`/${locale}/sign-in`} className="font-medium text-accent hover:underline">
              {t('signInLink')}
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
