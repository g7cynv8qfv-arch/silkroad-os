import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RiskBadgeProps {
  score: number | null | undefined;
  className?: string;
}

function getRiskVariant(score: number): 'success' | 'warning' | 'danger' {
  if (score <= 3) return 'success';
  if (score <= 6) return 'warning';
  return 'danger';
}

function getRiskLabel(score: number): string {
  if (score <= 3) return 'Low';
  if (score <= 6) return 'Medium';
  return 'High';
}

export function RiskBadge({ score, className }: RiskBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <Badge variant="secondary" className={cn('font-mono text-xs', className)}>
        —
      </Badge>
    );
  }

  const variant = getRiskVariant(score);
  const label = getRiskLabel(score);

  return (
    <Badge variant={variant} className={cn('font-mono text-xs tabular-nums', className)}>
      {score.toFixed(1)} · {label}
    </Badge>
  );
}
