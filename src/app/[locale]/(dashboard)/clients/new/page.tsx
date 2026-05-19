import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/ui/page-header';
import { ClientForm } from '@/features/clients/components/client-form';

export default async function NewClientPage() {
  const t = await getTranslations('clients.form');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('create.title')}
        breadcrumbs={[{ label: 'Clients', href: '/clients' }, { label: t('create.title') }]}
      />
      <ClientForm mode="create" />
    </div>
  );
}
