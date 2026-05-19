import { getTranslations } from 'next-intl/server';
import { getCurrentOrg } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Link } from '@/lib/i18n/navigation';
import { Plus, Building2 } from 'lucide-react';
import { listClients, PAGE_SIZE } from '@/features/clients/queries';
import { clientFiltersSchema } from '@/features/clients/schemas';
import { ClientTable } from '@/features/clients/components/client-table';

interface PageProps {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const [t, { orgId }] = await Promise.all([getTranslations('clients.list'), getCurrentOrg()]);

  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === 'string') raw[k] = v;
    else if (Array.isArray(v) && v[0]) raw[k] = v[0];
  }

  const filters = clientFiltersSchema.parse(raw);
  const { items, total, pageCount, page } = await listClients(orgId, filters);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumbs={[{ label: t('title') }]}
        actions={
          <Link href="/clients/new">
            <Button>
              <Plus className="h-4 w-4" />
              {t('newClient')}
            </Button>
          </Link>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t('empty.title')}
          description={t('empty.description')}
          action={
            <Link href="/clients/new">
              <Button>
                <Plus className="h-4 w-4" />
                {t('empty.cta')}
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          <ClientTable items={items as never} />

          {pageCount > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} clients
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`?${new URLSearchParams({ ...raw, page: String(page - 1) }).toString()}`}
                    className="rounded border border-border px-3 py-1.5 transition-colors hover:bg-surface-2"
                  >
                    Previous
                  </Link>
                )}
                {page < pageCount && (
                  <Link
                    href={`?${new URLSearchParams({ ...raw, page: String(page + 1) }).toString()}`}
                    className="rounded border border-border px-3 py-1.5 transition-colors hover:bg-surface-2"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
