import {
  parseAddressValue,
  serializeAddressValue,
  type AddressValue,
} from '../features/ops/AddressPicker';

const EMPTY: AddressValue = {
  region_id: '',
  region_name: '',
  province_id: '',
  province_name: '',
  city_id: '',
  city_name: '',
  barangay_id: '',
  barangay_name: '',
  street: '',
};

export function terminalToAddressSerialized(terminal: {
  location?: string | null;
  region?: string | null;
  city?: string | null;
}): string {
  const parsed = parseAddressValue(terminal.location);
  const hasStructured =
    parsed.region_id ||
    parsed.province_id ||
    parsed.city_id ||
    parsed.barangay_id ||
    (parsed.region_name && parsed.city_name);

  if (hasStructured) {
    return serializeAddressValue({
      ...parsed,
      region_name: parsed.region_name || terminal.region || '',
      city_name: parsed.city_name || terminal.city || '',
    });
  }

  if (terminal.region || terminal.city || terminal.location) {
    return serializeAddressValue({
      ...EMPTY,
      region_name: terminal.region ?? '',
      city_name: terminal.city ?? '',
      street: terminal.location ?? '',
    });
  }

  return '';
}

export function addressSerializedToTerminalFields(serialized: string) {
  const value = parseAddressValue(serialized);
  return {
    location: serialized.trim() || undefined,
    region: value.region_name.trim() || undefined,
    city: value.city_name.trim() || undefined,
  };
}

export function isTerminalAddressComplete(serialized: string): boolean {
  const value = parseAddressValue(serialized);
  return !!(value.region_id && value.province_id && value.city_id);
}

export function formatTerminalAddressSummary(serialized: string | undefined | null): string {
  const value = parseAddressValue(serialized);
  const parts = [
    value.street,
    value.barangay_name,
    value.city_name,
    value.province_name,
    value.region_name,
  ].filter(Boolean);
  return parts.join(', ');
}

/** Local address line for tables — street, barangay, city; never raw JSON. */
export function formatTerminalLocationShort(terminal: {
  location?: string | null;
  region?: string | null;
  city?: string | null;
}): string {
  const value = parseAddressValue(terminal.location);
  const street = (value.street ?? '').trim();
  const parts = [
    street && !street.startsWith('{') ? street : '',
    value.barangay_name,
    value.city_name,
  ].filter(Boolean);
  const local = parts.join(', ');
  if (local) return local;

  const raw = (terminal.location ?? '').trim();
  if (raw && !raw.startsWith('{')) return raw;

  return terminal.city || terminal.region || '—';
}

export function formatTerminalLocationOrFallback(
  terminal: {
    location?: string | null;
    region?: string | null;
    city?: string | null;
  },
  fallback: string,
): string {
  const label = formatTerminalLocationShort(terminal);
  return label === '—' ? fallback : label;
}

export function formatTerminalLocationLabel(terminal: {
  location?: string | null;
  region?: string | null;
  city?: string | null;
}): string {
  const summary = formatTerminalAddressSummary(terminal.location);
  if (summary) return summary;
  return [terminal.city, terminal.region].filter(Boolean).join(', ') || '—';
}

export function parseTerminalAddress(serialized: string | undefined | null): AddressValue {
  return parseAddressValue(serialized);
}
