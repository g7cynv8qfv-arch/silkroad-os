import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CountryFlag } from './country-flag';
import { RatingStars } from './rating-stars';
import { RiskBadge } from './risk-badge';
import { Link } from '@/lib/i18n/navigation';
import type { SupplierListItem } from '../types';

interface SupplierCardProps {
  supplier: SupplierListItem;
}

const STATUS_VARIANT: Record<string, 'success' | 'secondary' | 'danger'> = {
  ACTIVE: 'success',
  ARCHIVED: 'secondary',
  BLACKLISTED: 'danger',
};

export function SupplierCard({ supplier }: SupplierCardProps) {
  const lastOrderDate = supplier.orders[0]?.createdAt;

  return (
    <Link href={`/suppliers/${supplier.id}`}>
      <Card className="group cursor-pointer transition-shadow hover:border-accent/40 hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground transition-colors group-hover:text-accent">
                {supplier.name}
              </p>
              <CountryFlag code={supplier.country} className="mt-1" />
            </div>
            <Badge
              variant={STATUS_VARIANT[supplier.status] ?? 'secondary'}
              className="shrink-0 text-xs"
            >
              {supplier.status}
            </Badge>
          </div>

          {supplier.mainCategory && (
            <p className="mt-2 text-xs text-muted-foreground">{supplier.mainCategory}</p>
          )}

          <div className="mt-3 flex items-center justify-between gap-2">
            <RatingStars rating={supplier.rating} />
            <RiskBadge score={supplier.riskScore} />
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{supplier._count.orders} orders</span>
            {lastOrderDate && (
              <span>
                Last:{' '}
                {lastOrderDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
