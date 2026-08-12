const LEGAL_SUFFIXES = new Set([
  'inc',
  'incorporated',
  'ltd',
  'limited',
  'co',
  'corp',
  'corporation',
  'llc',
  'ph',
  'philippines',
  'agency',
  'agencies',
]);

/** Short display code for a shipping line brand (e.g. ASL, MSTAR). */
export function shippingLineShortCode(brandName: string): string {
  const trimmed = brandName.trim();
  if (!trimmed) return 'SL';

  const words = trimmed.split(/[\s,./]+/).filter(Boolean);
  const first = words[0] ?? trimmed;

  if (/^[A-Z0-9]{2,6}$/.test(first)) {
    return first;
  }

  const core = words.filter((word) => !LEGAL_SUFFIXES.has(word.toLowerCase()));
  const source = core.length > 0 ? core : words;

  if (source.length >= 2) {
    return source
      .map((word) => word[0])
      .join('')
      .slice(0, 4)
      .toUpperCase();
  }

  return (source[0] ?? trimmed).slice(0, 4).toUpperCase();
}
