import { getTranslations } from 'next-intl/server';
import { getCurrentOrg } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { db } from '@/lib/db';
import { OrderForm } from '@/features/orders/components/order-form';

export default async function NewOrderPage() {
  const [t, { orgId }] = await Promise.all([getTranslations('orders.form'), getCurrentOrg()]);

  const suppliers = await db.supplier.findMany({
    where: { organizationId: orgId, status: 'ACTIVE' },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, country: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={t('create.title')}
        breadcrumbs={[{ label: 'Orders', href: '/orders' }, { label: t('create.title') }]}
      />

      <div className="rounded-xl border border-border bg-surface-1 p-6">
        <OrderForm suppliers={suppliers} />
      </div>
    </div>
  );
}
