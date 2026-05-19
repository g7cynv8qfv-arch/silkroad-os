import { notFound } from 'next/navigation';
import { getCurrentOrg } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/lib/i18n/navigation';
import { getInvoice } from '@/features/invoices/queries';
import { InvoiceStatusBadge } from '@/features/invoices/components/invoice-status-badge';
import { SendInvoiceButton } from '@/features/invoices/components/send-invoice-button';
import { RecordPaymentDialog } from '@/features/invoices/components/record-payment-dialog';
import { ChangeStatusButton } from '@/features/invoices/components/change-status-button';
import { formatCents, taxRateBpsToPct } from '@/lib/currency';
import { Download, ExternalLink } from 'lucide-react';
import type { InvoiceStatus } from '@/features/invoices/schemas';

const TYPE_LABELS: Record<string, string> = {
  PROFORMA: 'Proforma Invoice',
  COMMERCIAL: 'Commercial Invoice',
  CREDIT_NOTE: 'Credit Note',
};

const METHOD_LABELS: Record<string, string> = {
  WIRE_TRANSFER: 'Wire transfer',
  PAYPAL: 'PayPal',
  CREDIT_CARD: 'Credit card',
  CRYPTO: 'Crypto',
  OTHER: 'Other',
};

interface InvoiceDetailPageProps {
  params: { id: string };
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { orgId } = await getCurrentOrg();
  const invoice = await getInvoice(orgId, params.id);
  if (!invoice) notFound();

  const remainingCents = invoice.totalCents - invoice.paidCents;
  const canReceivePayment = ['SENT', 'OVERDUE'].includes(invoice.status) && remainingCents > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={invoice.invoiceNumber}
        breadcrumbs={[{ label: 'Invoices', href: '/invoices' }, { label: invoice.invoiceNumber }]}
        actions={
          <div className="flex items-center gap-2">
            <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer">
              <Badge
                variant="outline"
                className="h-9 cursor-pointer gap-1.5 rounded-md px-3 py-1.5 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                PDF
              </Badge>
            </a>
            <ChangeStatusButton invoiceId={invoice.id} status={invoice.status as InvoiceStatus} />
            {canReceivePayment && (
              <RecordPaymentDialog
                invoiceId={invoice.id}
                currency={invoice.currency}
                remainingCents={remainingCents}
              />
            )}
            <SendInvoiceButton
              invoiceId={invoice.id}
              status={invoice.status}
              clientEmail={invoice.client.email}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Invoice header */}
          <Card className="p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {TYPE_LABELS[invoice.type] ?? invoice.type}
                </h2>
                <p className="mt-0.5 font-mono text-sm text-muted-foreground">
                  {invoice.invoiceNumber}
                </p>
              </div>
              <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
            </div>

            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Issue date
                </p>
                <p className="text-sm">{invoice.issueDate.toLocaleDateString('en-GB')}</p>
              </div>
              {invoice.dueDate && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Due date
                  </p>
                  <p
                    className={`text-sm ${invoice.status === 'OVERDUE' ? 'font-semibold text-danger' : ''}`}
                  >
                    {invoice.dueDate.toLocaleDateString('en-GB')}
                  </p>
                </div>
              )}
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Currency
                </p>
                <p className="font-mono text-sm">{invoice.currency}</p>
              </div>
              {invoice.order && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Order
                  </p>
                  <Link
                    href={`/orders/${invoice.order.id}`}
                    className="flex items-center gap-1 text-sm text-accent hover:underline"
                  >
                    {invoice.order.orderNumber}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {/* Line items */}
          <Card className="overflow-hidden">
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-sm font-semibold">Line items</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-2">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Unit price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-6 py-3.5 text-foreground">{item.description}</td>
                    <td className="px-4 py-3.5 text-right text-muted-foreground">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-muted-foreground">
                      {formatCents(item.unitPriceCents, invoice.currency)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono font-medium">
                      {formatCents(item.totalCents, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="space-y-2 border-t border-border px-6 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">
                  {formatCents(invoice.subtotalCents, invoice.currency)}
                </span>
              </div>
              {invoice.taxCents > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    VAT ({taxRateBpsToPct(invoice.taxRateBps)}%)
                  </span>
                  <span className="font-mono">
                    {formatCents(invoice.taxCents, invoice.currency)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold">
                <span>Total</span>
                <span className="font-mono text-accent">
                  {formatCents(invoice.totalCents, invoice.currency)}
                </span>
              </div>
              {invoice.paidCents > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-success">Paid</span>
                  <span className="font-mono text-success">
                    {formatCents(invoice.paidCents, invoice.currency)}
                  </span>
                </div>
              )}
              {remainingCents > 0 && invoice.paidCents > 0 && (
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-warning">Remaining</span>
                  <span className="font-mono text-warning">
                    {formatCents(remainingCents, invoice.currency)}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Payment notes */}
          {invoice.notes && (
            <Card className="p-6">
              <h3 className="mb-3 text-sm font-semibold">Payment instructions</h3>
              <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">
                {invoice.notes}
              </pre>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client */}
          <Card className="p-6">
            <h3 className="mb-4 text-sm font-semibold">Client</h3>
            <div className="space-y-1.5">
              <Link
                href={`/clients/${invoice.client.id}`}
                className="font-medium text-foreground transition-colors hover:text-accent"
              >
                {invoice.client.name}
              </Link>
              {invoice.client.email && (
                <p className="text-sm text-muted-foreground">{invoice.client.email}</p>
              )}
              {invoice.client.taxId && (
                <p className="font-mono text-xs text-muted-foreground">
                  VAT: {invoice.client.taxId}
                </p>
              )}
              {invoice.client.addressLine1 && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>{invoice.client.addressLine1}</p>
                  {invoice.client.addressLine2 && <p>{invoice.client.addressLine2}</p>}
                  {(invoice.client.city || invoice.client.postalCode) && (
                    <p>
                      {[invoice.client.postalCode, invoice.client.city].filter(Boolean).join(' ')}
                    </p>
                  )}
                  <p>{invoice.client.country}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Payments */}
          {invoice.payments.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-4 text-sm font-semibold">Payment history</h3>
              <div className="space-y-3">
                {invoice.payments.map((payment) => (
                  <div key={payment.id} className="flex items-start justify-between gap-2 text-sm">
                    <div>
                      <p className="font-medium text-success">
                        {formatCents(payment.amountCents, payment.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.paidAt.toLocaleDateString('en-GB')} ·{' '}
                        {METHOD_LABELS[payment.method] ?? payment.method}
                      </p>
                      {payment.reference && (
                        <p className="font-mono text-xs text-muted-foreground">
                          {payment.reference}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Meta */}
          <Card className="p-6">
            <h3 className="mb-4 text-sm font-semibold">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created</dt>
                <dd>{invoice.createdAt.toLocaleDateString('en-GB')}</dd>
              </div>
              {invoice.sentAt && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Sent</dt>
                  <dd>{invoice.sentAt.toLocaleDateString('en-GB')}</dd>
                </div>
              )}
              {invoice.paymentTermsDays != null && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Payment terms</dt>
                  <dd>Net {invoice.paymentTermsDays}</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
