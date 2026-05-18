import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentOrg } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { getOrder } from '@/features/orders/queries';
import { ShipmentForm } from '@/features/orders/components/shipment-form';

interface ShipmentPageProps {
  params: { locale: string; id: string };
}

export default async function ShipmentPage({ params }: ShipmentPageProps) {
  const [t, { orgId }] = await Promise.all([getTranslations('orders.shipment'), getCurrentOrg()]);

  const order = await getOrder(orgId, params.id);
  if (!order) notFound();

  const existingShipment = order.shipments[0] ?? null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={existingShipment ? t('editTitle') : t('addTitle')}
        breadcrumbs={[
          { label: 'Orders', href: '/orders' },
          { label: order.orderNumber, href: `/orders/${order.id}` },
          { label: existingShipment ? t('editTitle') : t('addTitle') },
        ]}
      />

      <div className="rounded-xl border border-border bg-surface-1 p-6">
        <ShipmentForm
          orderId={order.id}
          orderNumber={order.orderNumber}
          existingShipment={existingShipment}
        />
      </div>
    </div>
  );
}
