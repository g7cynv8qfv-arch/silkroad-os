import { getSupplierOrders } from '../queries';
import { getTranslations } from 'next-intl/server';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Link } from '@/lib/i18n/navigation';
import { ShoppingCart } from 'lucide-react';

interface TabOrdersProps {
  supplierId: string;
  orgId: string;
}

const ORDER_STATUS_VARIANT: Record<
  string,
  'default' | 'secondary' | 'warning' | 'success' | 'danger' | 'info'
> = {
  QUOTED: 'secondary',
  CONFIRMED: 'info',
  IN_PRODUCTION: 'warning',
  QC: 'warning',
  SHIPPED: 'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  QUOTED: 'Quoted',
  CONFIRMED: 'Confirmed',
  IN_PRODUCTION: 'In Production',
  QC: 'QC',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export async function TabOrders({ supplierId, orgId }: TabOrdersProps) {
  const [t, orders] = await Promise.all([
    getTranslations('suppliers.detail.orders'),
    getSupplierOrders(orgId, supplierId),
  ]);

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title={t('empty.title')}
        description={t('empty.description')}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <tr>
          <TableHead>Order #</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Expected delivery</TableHead>
          <TableHead>Created</TableHead>
        </tr>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell>
              <Link
                href={`/orders/${order.id}`}
                className="font-mono text-xs font-medium text-accent hover:underline"
              >
                {order.orderNumber}
              </Link>
            </TableCell>
            <TableCell>
              <Badge
                variant={ORDER_STATUS_VARIANT[order.status] ?? 'secondary'}
                className="text-xs"
              >
                {ORDER_STATUS_LABEL[order.status] ?? order.status}
              </Badge>
            </TableCell>
            <TableCell className="font-mono text-xs tabular-nums">
              {formatCents(order.totalCents, order.currency)}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {order.expectedDeliveryAt
                ? order.expectedDeliveryAt.toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </TableCell>
            <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
              {order.createdAt.toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
