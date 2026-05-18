import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentOrg } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/i18n/navigation';
import { FileText, Plus, Truck, ClipboardCheck } from 'lucide-react';
import { getOrder, getOrderTimeline } from '@/features/orders/queries';
import { OrderTimeline } from '@/features/orders/components/order-timeline';
import { OrderItemsTable } from '@/features/orders/components/order-items-table';
import { FinancialPanel } from '@/features/orders/components/financial-panel';
import { ShipmentTracker } from '@/features/orders/components/shipment-tracker';
import { StatusUpdater } from '@/features/orders/components/status-updater';

interface OrderDetailPageProps {
  params: { locale: string; id: string };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const [t, { orgId }] = await Promise.all([getTranslations('orders.detail'), getCurrentOrg()]);

  const [order, timeline] = await Promise.all([
    getOrder(orgId, params.id),
    getOrderTimeline(orgId, params.id),
  ]);

  if (!order) notFound();

  const primaryShipment = order.shipments[0] ?? null;
  const latestQc = order.qualityChecks[0] ?? null;
  const linkedInvoice = order.invoices[0] ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.orderNumber}
        breadcrumbs={[{ label: 'Orders', href: '/orders' }, { label: order.orderNumber }]}
        actions={
          <div className="flex items-center gap-2">
            <StatusUpdater orderId={order.id} currentStatus={order.status} />
          </div>
        }
      />

      {/* Supplier link + meta */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface-1 px-4 py-3 text-sm">
        <div>
          <span className="text-muted-foreground">Supplier: </span>
          {order.supplier ? (
            <Link
              href={`/suppliers/${order.supplier.id}`}
              className="font-medium text-accent transition-colors hover:text-accent/80"
            >
              {order.supplier.name}
            </Link>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
        <div className="hidden text-border sm:block">|</div>
        <div>
          <span className="text-muted-foreground">Currency: </span>
          <span className="font-mono font-medium text-foreground">{order.currency}</span>
        </div>
        {order.expectedDeliveryAt && (
          <>
            <div className="hidden text-border sm:block">|</div>
            <div>
              <span className="text-muted-foreground">ETA: </span>
              <span className="font-mono font-medium text-foreground">
                {order.expectedDeliveryAt.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </>
        )}
        <div className="hidden text-border sm:block">|</div>
        <div>
          <span className="text-muted-foreground">Created: </span>
          <span className="font-mono text-foreground">
            {order.createdAt.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: items + finance */}
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t('items.title')}
            </h2>
            <OrderItemsTable items={order.items} currency={order.currency} />
          </section>

          {/* Finance */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t('finance.title')}
            </h2>
            <FinancialPanel
              totalCents={order.totalCents}
              currency={order.currency}
              marginCents={order.marginCents}
              linkedInvoice={linkedInvoice}
            />
          </section>

          {/* Shipment */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t('shipment.title')}
              </h2>
              <Link href={`/orders/${order.id}/shipment`}>
                <Button size="sm" variant="outline">
                  <Truck className="h-3.5 w-3.5" />
                  {primaryShipment ? t('shipment.edit') : t('shipment.add')}
                </Button>
              </Link>
            </div>
            {primaryShipment ? (
              <div className="rounded-lg border border-border bg-surface-1 p-4">
                <ShipmentTracker shipment={primaryShipment} />
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                <Truck className="h-5 w-5 shrink-0" />
                No shipment added yet.{' '}
                <Link href={`/orders/${order.id}/shipment`} className="text-accent hover:underline">
                  Add shipment details
                </Link>
              </div>
            )}
          </section>

          {/* QC */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t('qc.title')}
              </h2>
              <Link href={`/orders/${order.id}/qc`}>
                <Button size="sm" variant="outline">
                  <Plus className="h-3.5 w-3.5" />
                  {t('qc.add')}
                </Button>
              </Link>
            </div>
            {latestQc ? (
              <div className="rounded-lg border border-border bg-surface-1 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck
                      className={
                        latestQc.passed ? 'h-5 w-5 text-emerald-400' : 'h-5 w-5 text-danger'
                      }
                    />
                    <span
                      className={
                        latestQc.passed ? 'font-medium text-emerald-400' : 'font-medium text-danger'
                      }
                    >
                      {latestQc.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {latestQc.performedAt.toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {latestQc.defectsFound > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {latestQc.defectsFound} defect{latestQc.defectsFound !== 1 ? 's' : ''} found
                  </p>
                )}
                {latestQc.inspector && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Inspector: {latestQc.inspector}
                  </p>
                )}
                {latestQc.notes && <p className="mt-2 text-sm text-foreground">{latestQc.notes}</p>}
                {latestQc.reportUrl && (
                  <a
                    href={latestQc.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1.5 text-xs text-accent hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    View report
                  </a>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                <ClipboardCheck className="h-5 w-5 shrink-0" />
                No QC report yet.{' '}
                <Link href={`/orders/${order.id}/qc`} className="text-accent hover:underline">
                  Add QC report
                </Link>
              </div>
            )}
          </section>
        </div>

        {/* Right column: timeline */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('timeline.title')}
          </h2>
          <div className="rounded-xl border border-border bg-surface-1 p-4">
            <OrderTimeline
              status={order.status}
              createdAt={order.createdAt}
              deliveredAt={order.deliveredAt}
              logs={timeline}
            />
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="mt-4 rounded-lg border border-border bg-surface-1 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Notes
              </p>
              <p className="text-sm text-foreground">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
