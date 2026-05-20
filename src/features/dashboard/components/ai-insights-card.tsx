import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Sparkles, AlertTriangle, TrendingUp, Info, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAiInsights } from '../queries';
import type { Insight } from '@/lib/ai/prompts/dashboard-insights';

const TYPE_CONFIG = {
  warning: {
    Icon: AlertTriangle,
    border: 'border-warning/30',
    bg: 'bg-warning/5',
    icon: 'text-warning',
    badge: 'bg-warning/15 text-warning',
  },
  opportunity: {
    Icon: TrendingUp,
    border: 'border-success/30',
    bg: 'bg-success/5',
    icon: 'text-success',
    badge: 'bg-success/15 text-success',
  },
  info: {
    Icon: Info,
    border: 'border-info/30',
    bg: 'bg-info/5',
    icon: 'text-info',
    badge: 'bg-info/15 text-info',
  },
} as const;

function InsightCard({ insight, locale }: { insight: Insight; locale: string }) {
  void locale;
  const cfg = TYPE_CONFIG[insight.type];
  const { Icon } = cfg;

  const card = (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        cfg.border,
        cfg.bg,
        insight.ctaHref && 'hover:border-opacity-60',
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn('mt-0.5 shrink-0', cfg.icon)} aria-hidden="true">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-foreground">{insight.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{insight.body}</p>
          {insight.ctaLabel && (
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent">
              {insight.ctaLabel}
              <ArrowRight className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (insight.ctaHref) {
    return (
      <Link
        href={insight.ctaHref}
        className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={`${insight.title} — ${insight.ctaLabel}`}
      >
        {card}
      </Link>
    );
  }

  return card;
}

interface AiInsightsPanelProps {
  orgId: string;
  locale: string;
}

export async function AiInsightsPanel({ orgId, locale }: AiInsightsPanelProps) {
  const [t, insights] = await Promise.all([getTranslations('dashboard'), getAiInsights(orgId)]);

  return (
    <section
      className="flex flex-col rounded-xl border border-border bg-surface-1 p-5"
      aria-label={t('aiInsights.title')}
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-foreground">{t('aiInsights.title')}</h2>
        <span className="ml-auto rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {t('aiInsights.badge')}
        </span>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} locale={locale} />
        ))}
      </div>

      <p className="mt-4 text-[10px] text-muted-foreground/60">{t('aiInsights.disclaimer')}</p>
    </section>
  );
}
