import type { OrderItem } from '@prisma/client';

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

interface OrderItemsTableProps {
  items: OrderItem[];
  currency: string;
}

export function OrderItemsTable({ items, currency }: OrderItemsTableProps) {
  const total = items.reduce((sum, i) => sum + i.totalCents, 0);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2">
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
              Product
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">SKU</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Qty</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
              Unit price
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-b border-border/50 last:border-0 hover:bg-surface-2/30"
            >
              <td className="px-4 py-3 font-medium text-foreground">{item.productName}</td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                {item.sku ?? '—'}
              </td>
              <td className="px-4 py-3 text-right font-mono text-foreground">
                {item.quantity.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right font-mono text-foreground">
                {fmt(item.unitPriceCents, currency)}
              </td>
              <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                {fmt(item.totalCents, currency)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-surface-2">
            <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-foreground">
              Total
            </td>
            <td className="px-4 py-3 text-right font-mono text-base font-bold text-foreground">
              {fmt(total, currency)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
