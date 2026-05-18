import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentOrg } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { getOrder } from '@/features/orders/queries';
import { QcReportForm } from '@/features/orders/components/qc-report-form';

interface QcPageProps {
  params: { locale: string; id: string };
}

export default async function QcPage({ params }: QcPageProps) {
  const [t, { orgId }] = await Promise.all([getTranslations('orders.qc'), getCurrentOrg()]);

  const order = await getOrder(orgId, params.id);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={t('title')}
        breadcrumbs={[
          { label: 'Orders', href: '/orders' },
          { label: order.orderNumber, href: `/orders/${order.id}` },
          { label: t('title') },
        ]}
      />

      <div className="rounded-xl border border-border bg-surface-1 p-6">
        <QcReportForm orderId={order.id} orderNumber={order.orderNumber} />
      </div>
    </div>
  );
}
