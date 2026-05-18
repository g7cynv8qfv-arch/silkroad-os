export const COUNTRIES: { code: string; name: string; nameFr: string }[] = [
  { code: 'CN', name: 'China', nameFr: 'Chine' },
  { code: 'US', name: 'United States', nameFr: 'États-Unis' },
  { code: 'IN', name: 'India', nameFr: 'Inde' },
  { code: 'VN', name: 'Vietnam', nameFr: 'Viêt Nam' },
  { code: 'BD', name: 'Bangladesh', nameFr: 'Bangladesh' },
  { code: 'TR', name: 'Turkey', nameFr: 'Turquie' },
  { code: 'PK', name: 'Pakistan', nameFr: 'Pakistan' },
  { code: 'ID', name: 'Indonesia', nameFr: 'Indonésie' },
  { code: 'TH', name: 'Thailand', nameFr: 'Thaïlande' },
  { code: 'MY', name: 'Malaysia', nameFr: 'Malaisie' },
  { code: 'KR', name: 'South Korea', nameFr: 'Corée du Sud' },
  { code: 'JP', name: 'Japan', nameFr: 'Japon' },
  { code: 'TW', name: 'Taiwan', nameFr: 'Taïwan' },
  { code: 'PH', name: 'Philippines', nameFr: 'Philippines' },
  { code: 'KH', name: 'Cambodia', nameFr: 'Cambodge' },
  { code: 'MM', name: 'Myanmar', nameFr: 'Myanmar' },
  { code: 'DE', name: 'Germany', nameFr: 'Allemagne' },
  { code: 'IT', name: 'Italy', nameFr: 'Italie' },
  { code: 'FR', name: 'France', nameFr: 'France' },
  { code: 'ES', name: 'Spain', nameFr: 'Espagne' },
  { code: 'PT', name: 'Portugal', nameFr: 'Portugal' },
  { code: 'PL', name: 'Poland', nameFr: 'Pologne' },
  { code: 'GB', name: 'United Kingdom', nameFr: 'Royaume-Uni' },
  { code: 'MX', name: 'Mexico', nameFr: 'Mexique' },
  { code: 'BR', name: 'Brazil', nameFr: 'Brésil' },
  { code: 'EG', name: 'Egypt', nameFr: 'Égypte' },
  { code: 'MA', name: 'Morocco', nameFr: 'Maroc' },
  { code: 'NG', name: 'Nigeria', nameFr: 'Nigéria' },
  { code: 'ZA', name: 'South Africa', nameFr: 'Afrique du Sud' },
];

const CODE_MAP = new Map(COUNTRIES.map((c) => [c.code, c]));

export function getCountry(code: string) {
  return CODE_MAP.get(code.toUpperCase());
}

export function getCountryName(code: string, locale: 'en' | 'fr' = 'en'): string {
  const country = CODE_MAP.get(code.toUpperCase());
  if (!country) return code;
  return locale === 'fr' ? country.nameFr : country.name;
}

export function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
}
