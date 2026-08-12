import type { TruckerPreForecastSubmissionDto } from '../../shared/types';

export type CyIntakeSizeCounts = {
  preForecast20: number;
  preForecast40: number;
  confirmed20: number;
  confirmed40: number;
};

export type CyIntakeTerminalCounts = CyIntakeSizeCounts & {
  preForecast: number;
  confirmed: number;
};

const CY_CONFIRMED_STATUSES = new Set([
  'CyScheduleConfirmed',
  'PendingAccountingReview',
  'AwaitingDetentionPayment',
  'PendingReview',
  'AwaitingRenewalPayment',
  'Completed',
]);

function is20ft(sizeCode?: string | null): boolean {
  return Boolean(sizeCode?.includes('20'));
}

function is40ft(sizeCode?: string | null): boolean {
  return Boolean(sizeCode?.includes('40'));
}

function isCyConfirmed(s: TruckerPreForecastSubmissionDto): boolean {
  if (s.status === 'PendingCySchedule' || s.status === 'PendingTerminalAssignment' || s.status === 'Cancelled') {
    return false;
  }
  return Boolean(s.cyConfirmedReturnDate) || CY_CONFIRMED_STATUSES.has(s.status);
}

export { isCyConfirmed };

function emptySizeCounts(): CyIntakeSizeCounts {
  return { preForecast20: 0, preForecast40: 0, confirmed20: 0, confirmed40: 0 };
}

function bumpSize(counts: CyIntakeSizeCounts, sizeCode: string | null | undefined, field: 'preForecast' | 'confirmed') {
  if (is40ft(sizeCode)) {
    counts[`${field}40`] += 1;
  } else if (is20ft(sizeCode)) {
    counts[`${field}20`] += 1;
  } else {
    counts[`${field}20`] += 1;
  }
}

/** Terminal-assigned awaiting CY date vs CY-confirmed return slot, split by 20ft/40ft. */
export function cyIntakeCountsForTerminal(
  intake: TruckerPreForecastSubmissionDto[],
  terminalId: string,
): CyIntakeTerminalCounts {
  const atTerminal = intake.filter((s) => s.assignedTerminalId === terminalId && s.status !== 'Cancelled');
  const sizes = emptySizeCounts();

  for (const s of atTerminal) {
    if (s.status === 'PendingCySchedule') {
      bumpSize(sizes, s.sizeCode, 'preForecast');
    } else if (isCyConfirmed(s)) {
      bumpSize(sizes, s.sizeCode, 'confirmed');
    }
  }

  return {
    ...sizes,
    preForecast: sizes.preForecast20 + sizes.preForecast40,
    confirmed: sizes.confirmed20 + sizes.confirmed40,
  };
}

export function cyIntakeCountsByTerminal(
  intake: TruckerPreForecastSubmissionDto[],
): Map<string, CyIntakeTerminalCounts> {
  const terminalIds = new Set(
    intake.map((s) => s.assignedTerminalId).filter((id): id is string => Boolean(id)),
  );
  const map = new Map<string, CyIntakeTerminalCounts>();
  for (const terminalId of terminalIds) {
    map.set(terminalId, cyIntakeCountsForTerminal(intake, terminalId));
  }
  return map;
}
