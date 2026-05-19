import { getTranslations } from 'next-intl/server';
import { getCurrentOrg } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { db } from '@/lib/db';
import { InvoiceForm } from '@/features/invoices/components/invoice-form';

export default async function NewInvoicePage() {
  const [t, { orgId }] = await Promise.all([getTranslations('invoices.form'), getCurrentOrg()]);

  const [clients, orders] = await Promise.all([
    db.client.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true },
    }),
    db.order.findMany({
      where: { organizationId: orgId, status: { not: 'CANCELLED' } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        orderNumber: true,
        items: {
          select: { productName: true, quantity: true, unitPriceCents: true },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('create.title')}
        breadcrumbs={[{ label: 'Invoices', href: '/invoices' }, { label: t('create.title') }]}
      />
      <InvoiceForm clients={clients} orders={orders} />
    </div>
  );
}
