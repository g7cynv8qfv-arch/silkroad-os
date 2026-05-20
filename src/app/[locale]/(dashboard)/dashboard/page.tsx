import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getCurrentOrg } from '@/lib/auth';
import { getOrgEmptyState } from '@/features/dashboard/queries';
import { DashboardEmptyState } from '@/features/dashboard/components/dashboard-empty-state';
import { StatCardsPanel } from '@/features/dashboard/components/stat-cards-panel';
import { ChartsPanel } from '@/features/dashboard/components/charts-panel';
import { ActivityFeedPanel } from '@/features/dashboard/components/activity-feed';
import { AiInsightsPanel } from '@/features/dashboard/components/ai-insights-card';
import {
  StatCardRowSkeleton,
  ChartPanelSkeleton,
  ActivityFeedSkeleton,
  AiInsightsSkeleton,
} from '@/features/dashboard/components/skeletons';

// Force dynamic so Suspense boundaries stream independently.
export const dynamic = 'force-dynamic';

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  // getCurrentOrg() is wrapped in React cache() — both calls resolve from the same DB round-trip.
  const [t, { orgId }] = await Promise.all([getTranslations('dashboard'), getCurrentOrg()]);
  const emptyState = await getOrgEmptyState(orgId);

  if (emptyState.isEmpty) {
    return <DashboardEmptyState />;
  }

  return (
    <main className="space-y-6 py-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{t('title')}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Row 1 — KPI stat cards */}
      <Suspense fallback={<StatCardRowSkeleton />}>
        <StatCardsPanel orgId={orgId} locale={locale} />
      </Suspense>

      {/* Row 2 — Charts */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartPanelSkeleton />
            <ChartPanelSkeleton />
          </div>
        }
      >
        <ChartsPanel orgId={orgId} locale={locale} />
      </Suspense>

      {/* Row 3 — Activity feed + AI insights */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Suspense fallback={<ActivityFeedSkeleton />}>
          <ActivityFeedPanel orgId={orgId} />
        </Suspense>

        <Suspense fallback={<AiInsightsSkeleton />}>
          <AiInsightsPanel orgId={orgId} locale={locale} />
        </Suspense>
      </div>
    </main>
  );
}
