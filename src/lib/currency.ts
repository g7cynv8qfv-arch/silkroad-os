export const CURRENCIES = ['USD', 'EUR', 'CNY', 'GBP'] as const;
export type Currency = (typeof CURRENCIES)[number];

const LOCALE_MAP: Record<string, string> = {
  USD: 'en-US',
  EUR: 'fr-FR',
  CNY: 'zh-CN',
  GBP: 'en-GB',
};

export function formatCents(cents: number, currency: string, locale?: string): string {
  return new Intl.NumberFormat(locale ?? LOCALE_MAP[currency] ?? 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function centsToDisplay(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function parseCurrencyInput(raw: string): number {
  const n = parseFloat(raw.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : Math.round(n * 100);
}

export function computeInvoiceTotals(
  items: { quantity: number; unitPriceCents: number }[],
  taxRateBps: number,
): { subtotalCents: number; taxCents: number; totalCents: number } {
  const subtotalCents = items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
  const taxCents = Math.round((subtotalCents * taxRateBps) / 10000);
  return { subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
}

export function taxRatePctToBps(pct: number): number {
  return Math.round(pct * 100);
}

export function taxRateBpsToPct(bps: number): number {
  return bps / 100;
}
