import { Badge } from '@/components/ui/badge';
import type { InvoiceStatus } from '../schemas';

const CONFIG: Record<
  InvoiceStatus,
  { label: string; variant: 'secondary' | 'info' | 'success' | 'danger' | 'warning' | 'outline' }
> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  SENT: { label: 'Sent', variant: 'info' },
  PAID: { label: 'Paid', variant: 'success' },
  OVERDUE: { label: 'Overdue', variant: 'danger' },
  CANCELLED: { label: 'Cancelled', variant: 'outline' },
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { label, variant } = CONFIG[status] ?? { label: status, variant: 'outline' };
  return <Badge variant={variant}>{label}</Badge>;
}
