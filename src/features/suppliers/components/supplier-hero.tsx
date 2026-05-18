import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CountryFlag } from './country-flag';
import { RatingStars } from './rating-stars';
import { RiskBadge } from './risk-badge';
import { Link } from '@/lib/i18n/navigation';
import { Pencil, Globe, ShoppingBag, Store } from 'lucide-react';
import type { SupplierWithRelations } from '../types';

interface SupplierHeroProps {
  supplier: SupplierWithRelations;
}

const STATUS_VARIANT: Record<string, 'success' | 'secondary' | 'danger'> = {
  ACTIVE: 'success',
  ARCHIVED: 'secondary',
  BLACKLISTED: 'danger',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
  BLACKLISTED: 'Blacklisted',
};

export function SupplierHero({ supplier }: SupplierHeroProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-1 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-2xl font-bold text-foreground">
            {supplier.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{supplier.name}</h1>
              <Badge variant={STATUS_VARIANT[supplier.status] ?? 'secondary'} className="text-xs">
                {STATUS_LABEL[supplier.status] ?? supplier.status}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <CountryFlag code={supplier.country} showName />
              {supplier.city && <span>{supplier.city}</span>}
              {supplier.mainCategory && <span>{supplier.mainCategory}</span>}
              {supplier.yearEstablished && <span>Est. {supplier.yearEstablished}</span>}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <RatingStars rating={supplier.rating} size="md" />
              <RiskBadge score={supplier.riskScore} />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {supplier.websiteUrl && (
            <a
              href={supplier.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
              aria-label="Visit website"
            >
              <Globe className="h-4 w-4" />
            </a>
          )}
          {supplier.alibabaUrl && (
            <a
              href={supplier.alibabaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
              aria-label="View Alibaba store"
            >
              <ShoppingBag className="h-4 w-4" />
            </a>
          )}
          {supplier.the1688Url && (
            <a
              href={supplier.the1688Url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
              aria-label="View 1688 store"
            >
              <Store className="h-4 w-4" />
            </a>
          )}
          <Link href={`/suppliers/${supplier.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {supplier.certifications.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {supplier.certifications.map((cert) => (
            <Badge key={cert} variant="outline" className="text-xs">
              {cert}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
