import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number | null | undefined;
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function RatingStars({ rating, max = 5, size = 'sm', className }: RatingStarsProps) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5';

  if (rating === null || rating === undefined) {
    return (
      <span className={cn('text-sm text-muted-foreground', className)} aria-label="No rating">
        —
      </span>
    );
  }

  return (
    <span
      className={cn('inline-flex items-center gap-0.5', className)}
      aria-label={`${rating.toFixed(1)} out of ${max} stars`}
    >
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const partial = !filled && i < rating;
        return (
          <span key={i} className="relative inline-block">
            <Star
              className={cn(iconSize, 'text-muted-foreground/30')}
              fill="currentColor"
              aria-hidden="true"
            />
            {(filled || partial) && (
              <Star
                className={cn(
                  iconSize,
                  'absolute inset-0 text-warning',
                  partial && 'clip-path-[inset(0_50%_0_0)]',
                )}
                fill="currentColor"
                style={
                  partial
                    ? { clipPath: `inset(0 ${(1 - (rating - Math.floor(rating))) * 100}% 0 0)` }
                    : undefined
                }
                aria-hidden="true"
              />
            )}
          </span>
        );
      })}
      <span className="ml-1 font-mono text-xs tabular-nums text-muted-foreground">
        {rating.toFixed(1)}
      </span>
    </span>
  );
}
