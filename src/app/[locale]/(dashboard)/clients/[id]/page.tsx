import { notFound } from 'next/navigation';
import { getCurrentOrg } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/i18n/navigation';
import { Plus, Building2, Pencil } from 'lucide-react';
import { getClient } from '@/features/clients/queries';
import { InvoiceStatusBadge } from '@/features/invoices/components/invoice-status-badge';
import { formatCents } from '@/lib/currency';
import type { InvoiceStatus } from '@/features/invoices/schemas';

interface ClientDetailPageProps {
  params: { id: string };
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { orgId } = await getCurrentOrg();
  const client = await getClient(orgId, params.id);
  if (!client) notFound();

  const totalRevenue = client.invoices.reduce((s, i) => s + i.totalCents, 0);
  const paidRevenue = client.invoices
    .filter((i) => i.status === 'PAID')
    .reduce((s, i) => s + i.totalCents, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        breadcrumbs={[{ label: 'Clients', href: '/clients' }, { label: client.name }]}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/clients/${client.id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            </Link>
            <Link href={`/invoices/new?clientId=${client.id}`}>
              <Button size="sm">
                <Plus className="h-3.5 w-3.5" />
                New invoice
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Client info */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">{client.name}</p>
                {client.email && <p className="text-sm text-muted-foreground">{client.email}</p>}
              </div>
            </div>

            <dl className="space-y-3 text-sm">
              {client.taxId && (
                <div>
                  <dt className="mb-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Tax ID
                  </dt>
                  <dd className="font-mono">{client.taxId}</dd>
                </div>
              )}
              {client.addressLine1 && (
                <div>
                  <dt className="mb-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Address
                  </dt>
                  <dd>
                    <p>{client.addressLine1}</p>
                    {client.addressLine2 && <p>{client.addressLine2}</p>}
                    {(client.postalCode || client.city) && (
                      <p>{[client.postalCode, client.city].filter(Boolean).join(' ')}</p>
                    )}
                    <p>{client.country}</p>
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Stats */}
          <Card className="space-y-4 p-6">
            <h3 className="text-sm font-semibold">Revenue</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total invoiced</span>
                <span className="font-mono font-medium">{formatCents(totalRevenue, 'USD')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Collected</span>
                <span className="font-mono font-medium text-success">
                  {formatCents(paidRevenue, 'USD')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total invoices</span>
                <span>{client._count.invoices}</span>
              </div>
            </div>
          </Card>

          {client.notes && (
            <Card className="p-6">
              <h3 className="mb-3 text-sm font-semibold">Notes</h3>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{client.notes}</p>
            </Card>
          )}
        </div>

        {/* Invoice history */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="text-sm font-semibold">Invoice history</h3>
              <Link
                href={`/invoices?clientId=${client.id}`}
                className="text-xs text-accent hover:underline"
              >
                View all
              </Link>
            </div>
            {client.invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <p className="text-sm text-muted-foreground">No invoices yet for this client.</p>
                <Link href={`/invoices/new?clientId=${client.id}`}>
                  <Button size="sm">
                    <Plus className="h-3.5 w-3.5" />
                    Create invoice
                  </Button>
                </Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-2">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Invoice
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Issue date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Due date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {client.invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-t border-border transition-colors hover:bg-surface-2"
                    >
                      <td className="px-6 py-3">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="font-mono text-xs font-medium text-accent hover:underline"
                        >
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <InvoiceStatusBadge status={inv.status as InvoiceStatus} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {inv.issueDate.toLocaleDateString('en-GB')}
                      </td>
                      <td
                        className={`px-4 py-3 ${inv.status === 'OVERDUE' ? 'text-danger' : 'text-muted-foreground'}`}
                      >
                        {inv.dueDate ? inv.dueDate.toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className="px-6 py-3 text-right font-mono font-medium">
                        {formatCents(inv.totalCents, inv.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
