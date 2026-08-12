import type { ContainerDto, ShippingLineDto, TruckerPreForecastSubmissionDto } from '../../shared/types';
import { isCyConfirmed } from './cyIntakeCounts';

export type ContainerSizeColumn = 'D2' | 'D4' | 'R2' | 'R5';

export const CONTAINER_SIZE_COLUMNS: ContainerSizeColumn[] = ['D2', 'D4', 'R2', 'R5'];

const COLUMN_LABELS: Record<ContainerSizeColumn, string> = {
  D2: 'D2',
  D4: 'D4',
  R2: 'R2',
  R5: 'R5',
};

export function containerSizeColumnLabel(column: ContainerSizeColumn): string {
  return COLUMN_LABELS[column];
}

/** Map size + type to ISO-style column keys (dry/reefer × 20/40). */
export function containerSizeColumn(
  sizeCode?: string | null,
  typeCode?: string | null,
): ContainerSizeColumn {
  const is40 = Boolean(sizeCode?.includes('40'));
  const isReefer = Boolean(typeCode?.match(/REEF|RF/i));
  if (isReefer) return is40 ? 'R5' : 'R2';
  if (is40) return 'D4';
  return 'D2';
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function todayDateKey(): string {
  return toDateKey(new Date());
}

export function formatScheduleDateLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00`);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function confirmedScheduleDateKey(submission: TruckerPreForecastSubmissionDto): string | null {
  if (!isCyConfirmed(submission)) return null;
  const raw = submission.cyConfirmedReturnDate ?? submission.returnDate;
  return raw?.slice(0, 10) ?? null;
}

export function pendingScheduleDateKey(submission: TruckerPreForecastSubmissionDto): string | null {
  if (submission.status !== 'PendingCySchedule') return null;
  const raw = submission.truckerPreferredReturnDate ?? submission.returnDate;
  return raw?.slice(0, 10) ?? null;
}

export type ShippingLineDayRow = {
  shippingLineKey: string;
  shippingLineName: string;
  shippingLine?: ShippingLineDto;
  counts: Record<ContainerSizeColumn, number>;
  total: number;
};

export type DayScheduleTotals = {
  dateKey: string;
  confirmed: number;
  pending: number;
};

function emptyColumnCounts(): Record<ContainerSizeColumn, number> {
  return { D2: 0, D4: 0, R2: 0, R5: 0 };
}

export function resolveShippingLine(
  lines: ShippingLineDto[],
  brandName: string,
): ShippingLineDto | undefined {
  const normalized = brandName.trim().toLowerCase();
  return lines.find((line) => line.brandName.trim().toLowerCase() === normalized);
}

export function buildDailyConfirmedSummary(
  intake: TruckerPreForecastSubmissionDto[],
  dateKey: string,
  containerById: Map<string, ContainerDto>,
  shippingLines: ShippingLineDto[],
): ShippingLineDayRow[] {
  const rows = new Map<string, ShippingLineDayRow>();

  for (const submission of intake) {
    if (submission.status === 'Cancelled') continue;
    const scheduleDate = confirmedScheduleDateKey(submission);
    if (scheduleDate !== dateKey) continue;

    const shippingLineName = submission.shippingLineBrandName?.trim() || 'Unknown';
    const key = shippingLineName.toLowerCase();
    const container = containerById.get(submission.containerId);
    const column = containerSizeColumn(submission.sizeCode ?? container?.sizeCode, container?.typeCode);

    let row = rows.get(key);
    if (!row) {
      row = {
        shippingLineKey: key,
        shippingLineName,
        shippingLine: resolveShippingLine(shippingLines, shippingLineName),
        counts: emptyColumnCounts(),
        total: 0,
      };
      rows.set(key, row);
    }

    row.counts[column] += 1;
    row.total += 1;
  }

  return [...rows.values()].sort((a, b) => a.shippingLineName.localeCompare(b.shippingLineName));
}

export function buildUpcomingDayTotals(
  intake: TruckerPreForecastSubmissionDto[],
  fromDateKey: string,
  days: number,
): DayScheduleTotals[] {
  const start = new Date(`${fromDateKey}T12:00:00`);
  const result: DayScheduleTotals[] = [];

  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    const dateKey = toDateKey(date);
    let confirmed = 0;
    let pending = 0;

    for (const submission of intake) {
      if (submission.status === 'Cancelled') continue;
      const confirmedDate = confirmedScheduleDateKey(submission);
      if (confirmedDate === dateKey) confirmed += 1;
      const pendingDate = pendingScheduleDateKey(submission);
      if (pendingDate === dateKey) pending += 1;
    }

    result.push({ dateKey, confirmed, pending });
  }

  return result;
}

export function columnGrandTotals(rows: ShippingLineDayRow[]): Record<ContainerSizeColumn, number> & { total: number } {
  const totals = emptyColumnCounts();
  let total = 0;
  for (const row of rows) {
    for (const column of CONTAINER_SIZE_COLUMNS) {
      totals[column] += row.counts[column];
    }
    total += row.total;
  }
  return { ...totals, total };
}
