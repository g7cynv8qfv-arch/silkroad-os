'use client';

import * as React from 'react';
import { useOrganizationList } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Building2 } from 'lucide-react';
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

export default function OnboardingPage() {
  const { createOrganization, setActive } = useOrganizationList();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('auth.onboarding');

  const [orgName, setOrgName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!createOrganization) return;

    setError(null);
    setLoading(true);

    try {
      const org = await createOrganization({ name: orgName.trim() });
      await setActive({ organization: org.id });
      router.push(`/${locale}/dashboard`);
    } catch {
      setError(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
          <Building2 className="h-5 w-5 text-accent" />
        </div>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <FormField label={t('orgNameLabel')} htmlFor="orgName" error={error ?? undefined}>
            <Input
              id="orgName"
              placeholder={t('orgNamePlaceholder')}
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              minLength={2}
            />
          </FormField>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" loading={loading} disabled={!orgName.trim()}>
            {t('submitButton')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
