import { notFound } from 'next/navigation';
import { getCurrentOrg } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { getClient } from '@/features/clients/queries';
import { ClientForm } from '@/features/clients/components/client-form';

interface EditClientPageProps {
  params: { id: string };
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const { orgId } = await getCurrentOrg();
  const client = await getClient(orgId, params.id);
  if (!client) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit client"
        breadcrumbs={[
          { label: 'Clients', href: '/clients' },
          { label: client.name, href: `/clients/${client.id}` },
          { label: 'Edit' },
        ]}
      />
      <ClientForm mode="edit" client={client} />
    </div>
  );
}
