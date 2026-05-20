import { getTranslations } from 'next-intl/server';
import { getOrdersPipelineData, getTopSuppliersByVolume } from '../queries';
import { OrdersPipelineChart } from './orders-pipeline-chart';
import { TopSuppliersChart } from './top-suppliers-chart';

interface ChartsPanelProps {
  orgId: string;
  locale: string;
}

export async function ChartsPanel({ orgId, locale }: ChartsPanelProps) {
  const t = await getTranslations('dashboard');

  const [pipeline, topSuppliers] = await Promise.all([
    getOrdersPipelineData(orgId),
    getTopSuppliersByVolume(orgId),
  ]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Orders pipeline */}
      <section
        className="flex flex-col rounded-xl border border-border bg-surface-1 p-5"
        aria-label={t('charts.pipeline.title')}
      >
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">{t('charts.pipeline.title')}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('charts.pipeline.subtitle')}</p>
        </div>
        <OrdersPipelineChart data={pipeline} />
      </section>

      {/* Top suppliers by volume */}
      <section
        className="flex flex-col rounded-xl border border-border bg-surface-1 p-5"
        aria-label={t('charts.topSuppliers.title')}
      >
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">
            {t('charts.topSuppliers.title')}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('charts.topSuppliers.subtitle')}
          </p>
        </div>
        <TopSuppliersChart data={topSuppliers} locale={locale} />
      </section>
    </div>
  );
}
