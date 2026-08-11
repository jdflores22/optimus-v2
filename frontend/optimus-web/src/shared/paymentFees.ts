import { API_BASE_URL } from './types';

const DEFAULT_EDO_FEE = 750;
export const DEFAULT_DETENTION_RATE = 150;

export function formatPhp(amount: number): string {
  return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function paymentFeeDocUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

/** Live admin-configured eDO fee (preferred for unpaid eDOs). */
export function resolveEdoFeeAmount(
  activeFee?: { amount: number } | null,
  edoFeeSnapshot?: number | null,
  options?: { lockSnapshot?: boolean },
): number {
  if (options?.lockSnapshot && edoFeeSnapshot != null) {
    return edoFeeSnapshot;
  }
  return activeFee?.amount ?? edoFeeSnapshot ?? DEFAULT_EDO_FEE;
}
