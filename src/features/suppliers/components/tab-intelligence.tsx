import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Sparkles, AlertTriangle, TrendingUp, ExternalLink } from 'lucide-react';
import type { IntelligenceReport } from '@prisma/client';

interface TabIntelligenceProps {
  supplierId: string;
  latestReport: IntelligenceReport | null;
}

function ScorePill({
  label,
  score,
  invert = false,
}: {
  label: string;
  score: number;
  invert?: boolean;
}) {
  const pct = score * 10;
  const isGood = invert ? score <= 3 : score >= 7;
  const isMid = score > 3 && score < 7;
  const colorClass = isGood ? 'text-success' : isMid ? 'text-warning' : 'text-danger';

  return (
    <div className="rounded-lg border border-border bg-surface-1 p-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-end gap-2">
        <p className={`text-3xl font-bold tabular-nums ${colorClass}`}>{score.toFixed(1)}</p>
        <p className="mb-0.5 text-xs text-muted-foreground">/10</p>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full transition-all ${colorClass.replace('text-', 'bg-')}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export async function TabIntelligence({ supplierId, latestReport }: TabIntelligenceProps) {
  const t = await getTranslations('suppliers.detail.intelligence');

  if (!latestReport) {
    return (
      <EmptyState
        icon={Sparkles}
        title={t('noReport.title')}
        description={t('noReport.description')}
        action={
          <Link href={`/intelligence?supplierId=${supplierId}`}>
            <Button>
              <Sparkles className="h-3.5 w-3.5" />
              {t('runAnalysis')}
            </Button>
          </Link>
        }
      />
    );
  }

  const redFlags = Array.isArray(latestReport.redFlags) ? (latestReport.redFlags as string[]) : [];
  const opportunities = Array.isArray(latestReport.opportunities)
    ? (latestReport.opportunities as string[])
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            {t('lastAnalysis')} ·{' '}
            {latestReport.createdAt.toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            Model: <span className="font-mono">{latestReport.model}</span> ·{' '}
            {latestReport.tokensUsed.toLocaleString()} tokens
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/intelligence?supplierId=${supplierId}`}>
            <Button variant="outline" size="sm">
              <Sparkles className="h-3.5 w-3.5" />
              {t('runAnalysis')}
            </Button>
          </Link>
          <Link href={`/intelligence/${latestReport.id}`}>
            <Button variant="ghost" size="sm">
              <ExternalLink className="h-3.5 w-3.5" />
              Full report
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ScorePill label={t('scores.risk')} score={latestReport.riskScore} invert />
        <ScorePill label={t('scores.credibility')} score={latestReport.credibilityScore} />
        <ScorePill label={t('scores.quality')} score={latestReport.qualitySignal} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground">{latestReport.summary}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {redFlags.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-danger">
                <AlertTriangle className="h-4 w-4" />
                {t('redFlags')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {redFlags.map((flag, i) => (
                <p key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                  {flag}
                </p>
              ))}
            </CardContent>
          </Card>
        )}

        {opportunities.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-success">
                <TrendingUp className="h-4 w-4" />
                {t('opportunities')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {opportunities.map((opp, i) => (
                <p key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                  {opp}
                </p>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
