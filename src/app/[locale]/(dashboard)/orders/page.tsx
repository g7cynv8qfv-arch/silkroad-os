import { getTranslations } from 'next-intl/server';
import { getCurrentOrg } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Link } from '@/lib/i18n/navigation';
import { Plus, PackageOpen } from 'lucide-react';
import { listOrders, listAllOrders, PAGE_SIZE } from '@/features/orders/queries';
import { orderFiltersSchema } from '@/features/orders/schemas';
import { OrderTable } from '@/features/orders/components/order-table';
import { OrderKanban } from '@/features/orders/components/order-kanban';
import { OrderFiltersBar } from '@/features/orders/components/order-filters';

interface OrdersPageProps {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const [t, { orgId }] = await Promise.all([getTranslations('orders.list'), getCurrentOrg()]);

  const rawParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === 'string') rawParams[k] = v;
    else if (Array.isArray(v) && v[0]) rawParams[k] = v[0];
  }

  const filters = orderFiltersSchema.parse(rawParams);
  const isKanban = filters.view === 'kanban';

  const [tableResult, allOrders] = await Promise.all([
    listOrders(orgId, filters),
    isKanban ? listAllOrders(orgId) : Promise.resolve(null),
  ]);

  const { items, total, pageCount, page } = tableResult;
  const hasActiveFilters = filters.q || filters.status;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumbs={[{ label: t('title') }]}
        actions={
          <Link href="/orders/new">
            <Button>
              <Plus className="h-4 w-4" />
              {t('newOrder')}
            </Button>
          </Link>
        }
      />

      <OrderFiltersBar filters={filters} />

      {isKanban ? (
        /* Kanban view — shows all non-cancelled orders, ignores pagination */
        (allOrders?.length ?? 0) === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title={t('empty.title')}
            description={t('empty.description')}
            action={
              <Link href="/orders/new">
                <Button>
                  <Plus className="h-4 w-4" />
                  {t('empty.cta')}
                </Button>
              </Link>
            }
          />
        ) : (
          <OrderKanban orders={allOrders ?? []} />
        )
      ) : /* Table view */ items.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={PackageOpen}
            title={t('emptyFiltered.title')}
            description={t('emptyFiltered.description')}
          />
        ) : (
          <EmptyState
            icon={PackageOpen}
            title={t('empty.title')}
            description={t('empty.description')}
            action={
              <Link href="/orders/new">
                <Button>
                  <Plus className="h-4 w-4" />
                  {t('empty.cta')}
                </Button>
              </Link>
            }
          />
        )
      ) : (
        <div className="space-y-4">
          <OrderTable items={items} sort={filters.sort} dir={filters.dir} />

          {/* Simple pagination */}
          {pageCount > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} orders
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/orders?${new URLSearchParams({ ...rawParams, page: String(page - 1) }).toString()}`}
                    className="rounded border border-border px-3 py-1.5 transition-colors hover:bg-surface-2"
                  >
                    Previous
                  </Link>
                )}
                {page < pageCount && (
                  <Link
                    href={`/orders?${new URLSearchParams({ ...rawParams, page: String(page + 1) }).toString()}`}
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
