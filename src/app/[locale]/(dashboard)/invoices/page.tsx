import { getTranslations } from 'next-intl/server';
import { getCurrentOrg } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Link } from '@/lib/i18n/navigation';
import { Plus, FileText } from 'lucide-react';
import { listInvoices, getFinanceDashboard, PAGE_SIZE } from '@/features/invoices/queries';
import { invoiceFiltersSchema } from '@/features/invoices/schemas';
import { InvoiceTable } from '@/features/invoices/components/invoice-table';
import { InvoiceFiltersBar } from '@/features/invoices/components/invoice-filters';
import { FinanceDashboardPanel } from '@/features/invoices/components/finance-dashboard';

interface PageProps {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function InvoicesPage({ searchParams }: PageProps) {
  const [t, { orgId }] = await Promise.all([getTranslations('invoices.list'), getCurrentOrg()]);

  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === 'string') raw[k] = v;
    else if (Array.isArray(v) && v[0]) raw[k] = v[0];
  }

  const filters = invoiceFiltersSchema.parse(raw);
  const isFinance = filters.tab === 'finance';

  const [tableResult, financeDashboard] = await Promise.all([
    isFinance ? Promise.resolve(null) : listInvoices(orgId, filters),
    isFinance ? getFinanceDashboard(orgId) : Promise.resolve(null),
  ]);

  const { items = [], total = 0, pageCount = 1, page = 1 } = tableResult ?? {};
  const hasFilters = filters.q || filters.status || filters.type;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumbs={[{ label: t('title') }]}
        actions={
          !isFinance && (
            <Link href="/invoices/new">
              <Button>
                <Plus className="h-4 w-4" />
                {t('newInvoice')}
              </Button>
            </Link>
          )
        }
      />

      {/* Tab switcher */}
      <div className="flex items-center gap-1 border-b border-border">
        <Link
          href="?tab=invoices"
          className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            !isFinance
              ? 'border-accent text-accent'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('tabs.invoices')}
        </Link>
        <Link
          href="?tab=finance"
          className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            isFinance
              ? 'border-accent text-accent'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('tabs.finance')}
        </Link>
      </div>

      {isFinance ? (
        financeDashboard && <FinanceDashboardPanel data={financeDashboard} />
      ) : (
        <>
          <InvoiceFiltersBar filters={filters} />

          {items.length === 0 ? (
            hasFilters ? (
              <EmptyState
                icon={FileText}
                title={t('emptyFiltered.title')}
                description={t('emptyFiltered.description')}
              />
            ) : (
              <EmptyState
                icon={FileText}
                title={t('empty.title')}
                description={t('empty.description')}
                action={
                  <Link href="/invoices/new">
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
              <InvoiceTable items={items} />

              {pageCount > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}{' '}
                    invoices
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
        </>
      )}
    </div>
  );
}
