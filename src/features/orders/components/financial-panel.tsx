import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

interface FinancialPanelProps {
  totalCents: number;
  currency: string;
  marginCents: number | null;
  linkedInvoice?: {
    invoiceNumber: string;
    totalCents: number;
    currency: string;
    status: string;
  } | null;
}

export function FinancialPanel({
  totalCents,
  currency,
  marginCents,
  linkedInvoice,
}: FinancialPanelProps) {
  const revenueCents = linkedInvoice
    ? linkedInvoice.totalCents
    : marginCents !== null
      ? totalCents + marginCents
      : null;

  const computedMarginCents =
    marginCents !== null ? marginCents : revenueCents !== null ? revenueCents - totalCents : null;

  const marginPct =
    computedMarginCents !== null && revenueCents !== null && revenueCents > 0
      ? (computedMarginCents / revenueCents) * 100
      : null;

  const MarginIcon =
    computedMarginCents === null ? Minus : computedMarginCents > 0 ? TrendingUp : TrendingDown;

  const marginColor =
    computedMarginCents === null
      ? 'text-muted-foreground'
      : computedMarginCents > 0
        ? 'text-emerald-400'
        : 'text-danger';

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {/* Cost */}
      <div className="rounded-lg border border-border bg-surface-2 p-4">
        <p className="text-xs text-muted-foreground">Total cost</p>
        <p className="mt-1 font-mono text-xl font-bold text-foreground">
          {fmt(totalCents, currency)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{currency}</p>
      </div>

      {/* Revenue */}
      <div className="rounded-lg border border-border bg-surface-2 p-4">
        <p className="text-xs text-muted-foreground">
          Expected revenue{linkedInvoice ? '' : ' (est.)'}
        </p>
        {revenueCents !== null ? (
          <>
            <p className="mt-1 font-mono text-xl font-bold text-foreground">
              {fmt(revenueCents, linkedInvoice?.currency ?? currency)}
            </p>
            {linkedInvoice && (
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {linkedInvoice.invoiceNumber}
              </p>
            )}
          </>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Link an invoice to track revenue</p>
        )}
      </div>

      {/* Margin */}
      <div className={cn('rounded-lg border border-border bg-surface-2 p-4', marginColor)}>
        <p className="text-xs text-muted-foreground">Margin</p>
        {computedMarginCents !== null ? (
          <div className="mt-1 flex items-center gap-1.5">
            <MarginIcon className={cn('h-5 w-5', marginColor)} />
            <span className="font-mono text-xl font-bold">
              {fmt(computedMarginCents, currency)}
            </span>
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">—</p>
        )}
        {marginPct !== null && (
          <p className={cn('mt-0.5 text-xs font-medium', marginColor)}>{marginPct.toFixed(1)}%</p>
        )}
      </div>
    </div>
  );
}
