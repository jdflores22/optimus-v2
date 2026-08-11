import type { TruckerPreForecastSubmissionDto } from '../../shared/types';
import { DEFAULT_DETENTION_RATE } from '../../shared/paymentFees';

export type DetentionChargeRow = {
  id: number;
  description: string;
  amount: string;
  /** System-generated line — removed when waiving CY extra days */
  kind?: 'preferred' | 'cy_extra' | 'custom';
};

export function formatDetentionDate(iso: string) {
  return iso.slice(0, 10);
}

/** Calendar days from day after free time through return date (matches backend). */
export function computeOverdueDays(freeUntilIso: string | null | undefined, returnIso: string): number {
  if (!freeUntilIso) return 0;
  const freeUntil = formatDetentionDate(freeUntilIso);
  const returnDate = formatDetentionDate(returnIso);
  const freeMs = Date.parse(`${freeUntil}T00:00:00`);
  const returnMs = Date.parse(`${returnDate}T00:00:00`);
  if (Number.isNaN(freeMs) || Number.isNaN(returnMs)) return 0;
  const firstDetentionMs = freeMs + 86400000;
  if (returnMs < firstDetentionMs) return 0;
  return Math.floor((returnMs - firstDetentionMs) / 86400000) + 1;
}

export function resolveFreeTimeUntil(submission: TruckerPreForecastSubmissionDto): string | null {
  return submission.freeTimeUntil ?? submission.expiredEdoExpiresAt ?? null;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function resolveStoredCalculationRate(
  submission: TruckerPreForecastSubmissionDto,
): number | null {
  if (submission.detentionRateAtCalculation != null && submission.detentionRateAtCalculation > 0) {
    return submission.detentionRateAtCalculation;
  }
  const freeTimeIso = resolveFreeTimeUntil(submission);
  const preferredDate = submission.truckerPreferredReturnDate ?? submission.returnDate;
  let overduePreferred = submission.overdueDaysAtPreferred ?? 0;
  if (overduePreferred <= 0 && freeTimeIso) {
    overduePreferred = computeOverdueDays(freeTimeIso, preferredDate);
  }
  if (overduePreferred > 0 && (submission.detentionAtPreferredDate ?? 0) > 0) {
    return roundMoney(submission.detentionAtPreferredDate! / overduePreferred);
  }
  return null;
}

/** True when shipping line admin changed the rate after CY confirmed the schedule. */
export function isDetentionRateStale(
  submission: TruckerPreForecastSubmissionDto,
  liveRate: number,
): boolean {
  const stored = resolveStoredCalculationRate(submission);
  if (stored == null || stored <= 0) return false;
  return Math.abs(stored - liveRate) > 0.009;
}

export function resolveDetentionMeta(
  submission: TruckerPreForecastSubmissionDto,
  rateOverride?: number,
) {
  const rate = rateOverride ?? submission.detentionRatePerDay ?? DEFAULT_DETENTION_RATE;
  const freeTimeIso = resolveFreeTimeUntil(submission);
  const preferredDate = submission.truckerPreferredReturnDate ?? submission.returnDate;
  const cyDate = submission.cyConfirmedReturnDate ?? submission.returnDate;

  let overduePreferred = submission.overdueDaysAtPreferred ?? 0;
  if (overduePreferred <= 0 && freeTimeIso) {
    overduePreferred = computeOverdueDays(freeTimeIso, preferredDate);
  }

  let overdueCy = submission.overdueDaysAtCyConfirmed ?? submission.overdueDays ?? 0;
  if (overdueCy <= 0 && freeTimeIso) {
    overdueCy = computeOverdueDays(freeTimeIso, cyDate);
  }
  if (overdueCy <= 0 && overduePreferred > 0) {
    overdueCy = overduePreferred + (submission.scheduleDeltaDays ?? 0);
  }

  let resolvedFreeIso = freeTimeIso;
  if (!resolvedFreeIso && overduePreferred > 0) {
    const pref = new Date(`${formatDetentionDate(preferredDate)}T12:00:00`);
    pref.setDate(pref.getDate() - overduePreferred);
    resolvedFreeIso = pref.toISOString();
  }

  const extraCyDays = submission.scheduleDeltaDays ?? Math.max(0, overdueCy - overduePreferred);
  // Always derive billing amounts from overdue days × current rate. Stored amounts on the
  // submission reflect the rate at CY confirm time and must not drive accounting billing.
  const preferredCharge = roundMoney(overduePreferred * rate);
  const extraCyCharge = roundMoney(extraCyDays * rate);

  return {
    rate,
    freeTimeIso: resolvedFreeIso,
    freeUntil: resolvedFreeIso ? formatDetentionDate(resolvedFreeIso) : '—',
    firstDetentionDay: resolvedFreeIso
      ? formatDetentionDate(new Date(Date.parse(`${formatDetentionDate(resolvedFreeIso)}T00:00:00`) + 86400000).toISOString())
      : '—',
    preferredDate: formatDetentionDate(preferredDate),
    cyDate: formatDetentionDate(cyDate),
    overduePreferred,
    overdueCy,
    preferredCharge,
    extraCyDays,
    extraCyCharge,
  };
}

export function buildDefaultDetentionChargeRows(
  submission: TruckerPreForecastSubmissionDto,
  waiveExtraDays: boolean,
  rateOverride?: number,
): DetentionChargeRow[] {
  const meta = resolveDetentionMeta(submission, rateOverride);
  const rows: DetentionChargeRow[] = [];
  let nextId = 1;

  if (meta.overduePreferred > 0 || meta.preferredCharge > 0) {
    rows.push({
      id: nextId++,
      kind: 'preferred',
      description: `Detention — ${meta.overduePreferred} overdue day(s) × ₱${meta.rate}/day (preferred return ${meta.preferredDate})`,
      amount: String(meta.preferredCharge),
    });
  }

  if (meta.extraCyDays > 0 && !waiveExtraDays) {
    rows.push({
      id: nextId++,
      kind: 'cy_extra',
      description: `Extra detention — ${meta.extraCyDays} CY day(s) × ₱${meta.rate}/day`,
      amount: String(meta.extraCyCharge),
    });
  }

  return rows;
}

/** Refresh system detention lines to live rate; keep custom lines. */
export function mergeDetentionChargeRows(
  submission: TruckerPreForecastSubmissionDto,
  currentRows: DetentionChargeRow[],
  waiveExtraDays: boolean,
  liveRate: number,
): DetentionChargeRow[] {
  const defaults = buildDefaultDetentionChargeRows(submission, waiveExtraDays, liveRate);
  const custom = currentRows.filter((row) => row.kind === 'custom');
  return [...defaults, ...custom.map((row, i) => ({ ...row, id: defaults.length + i + 1 }))];
}

export function parseChargeRows(rows: DetentionChargeRow[]) {
  return rows
    .map((row) => ({
      description: row.description.trim(),
      amount: Number(row.amount) || 0,
    }))
    .filter((row) => row.description && row.amount >= 0);
}

export function sumChargeRows(rows: DetentionChargeRow[]) {
  return parseChargeRows(rows).reduce((sum, row) => sum + row.amount, 0);
}

/** @deprecated use resolveDetentionMeta */
export function freeTimeSummary(submission: TruckerPreForecastSubmissionDto) {
  const meta = resolveDetentionMeta(submission);
  return {
    rate: meta.rate,
    freeUntil: meta.freeUntil,
    preferredDate: meta.preferredDate,
    cyDate: meta.cyDate,
    overduePreferred: meta.overduePreferred,
    overdueCy: meta.overdueCy,
    preferredCharge: meta.preferredCharge,
    extraCyDays: meta.extraCyDays,
    extraCyCharge: meta.extraCyCharge,
  };
}
