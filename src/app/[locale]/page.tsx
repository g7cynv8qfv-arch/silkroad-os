import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('app');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="font-sans text-5xl font-bold tracking-tight text-foreground">{t('name')}</h1>
        <p className="mt-3 font-sans text-lg text-muted-foreground">{t('tagline')}</p>
      </div>
    </main>
  );
}
