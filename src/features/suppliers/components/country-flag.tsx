import { countryCodeToFlag, getCountryName } from '@/lib/countries';
import { cn } from '@/lib/utils';

interface CountryFlagProps {
  code: string;
  locale?: 'en' | 'fr';
  showName?: boolean;
  className?: string;
}

export function CountryFlag({ code, locale = 'en', showName = true, className }: CountryFlagProps) {
  const flag = countryCodeToFlag(code);
  const name = getCountryName(code, locale);

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="text-base leading-none" aria-hidden="true">
        {flag}
      </span>
      {showName && <span className="text-sm text-foreground">{name}</span>}
      {!showName && <span className="sr-only">{name}</span>}
    </span>
  );
}
