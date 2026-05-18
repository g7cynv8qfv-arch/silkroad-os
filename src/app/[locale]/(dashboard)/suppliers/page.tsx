import { getTranslations } from 'next-intl/server';
import { getCurrentOrg } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Link } from '@/lib/i18n/navigation';
import { Plus, Building2 } from 'lucide-react';
import { listSuppliers } from '@/features/suppliers/queries';
import { supplierFiltersSchema } from '@/features/suppliers/schemas';
import { SupplierTable } from '@/features/suppliers/components/supplier-table';
import { SupplierFilters } from '@/features/suppliers/components/supplier-filters';
import { SupplierPagination } from '@/features/suppliers/components/supplier-pagination';
import { SupplierImportTrigger } from '@/features/suppliers/components/supplier-import-trigger';
import { PAGE_SIZE } from '@/features/suppliers/queries';

interface SuppliersPageProps {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function SuppliersPage({ searchParams }: SuppliersPageProps) {
  const [t, { orgId }] = await Promise.all([getTranslations('suppliers.list'), getCurrentOrg()]);

  const rawParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === 'string') rawParams[k] = v;
    else if (Array.isArray(v) && v[0]) rawParams[k] = v[0];
  }

  const filters = supplierFiltersSchema.parse(rawParams);
  const { items, total, pageCount, page } = await listSuppliers(orgId, filters);

  const hasActiveFilters = filters.q || filters.country || filters.category || filters.status;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumbs={[{ label: t('title') }]}
        actions={
          <div className="flex items-center gap-2">
            <SupplierImportTrigger />
            <Link href="/suppliers/new">
              <Button>
                <Plus className="h-4 w-4" />
                {t('newSupplier')}
              </Button>
            </Link>
          </div>
        }
      />

      <SupplierFilters filters={filters} />

      {items.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={Building2}
            title={t('emptyFiltered.title')}
            description={t('emptyFiltered.description')}
          />
        ) : (
          <EmptyState
            icon={Building2}
            title={t('empty.title')}
            description={t('empty.description')}
            action={
              <Link href="/suppliers/new">
                <Button>
                  <Plus className="h-4 w-4" />
                  {t('empty.cta')}
                </Button>
              </Link>
            }
          />
        )
      ) : (
        <>
          <SupplierTable items={items} sort={filters.sort} dir={filters.dir} />
          <SupplierPagination
            page={page}
            pageCount={pageCount}
            total={total}
            pageSize={PAGE_SIZE}
          />
        </>
      )}
    </div>
  );
}
