import type { TruckerPreForecastSubmissionDto } from '../../shared/types';

const TERMINAL_OPS_QUEUE_STATUSES = [
  'PendingTerminalAssignment',
  'PendingCySchedule',
  'PendingAccountingReview',
  'AwaitingDetentionPayment',
] as const;

const SL_STAFF_RENEWAL_QUEUE_STATUSES = ['PendingReview'] as const;

const ACCOUNTING_QUEUE_STATUSES = ['PendingAccountingReview', 'AwaitingDetentionPayment'] as const;

export function filterPreForecastQueue(
  list: TruckerPreForecastSubmissionDto[],
  role: string,
): TruckerPreForecastSubmissionDto[] {
  if (role === 'SlStaff') {
    return list.filter((x) =>
      SL_STAFF_RENEWAL_QUEUE_STATUSES.includes(x.status as (typeof SL_STAFF_RENEWAL_QUEUE_STATUSES)[number]),
    );
  }
  if (['TerminalTeam', 'ShippingLinesAdmin'].includes(role)) {
    return list.filter((x) =>
      TERMINAL_OPS_QUEUE_STATUSES.includes(x.status as (typeof TERMINAL_OPS_QUEUE_STATUSES)[number]),
    );
  }
  if (role === 'CyStaff') {
    return list.filter((x) => x.status === 'PendingCySchedule');
  }
  if (role === 'Accounting') {
    return list.filter((x) =>
      ACCOUNTING_QUEUE_STATUSES.includes(x.status as (typeof ACCOUNTING_QUEUE_STATUSES)[number]),
    );
  }
  return list;
}

/** Action-queue count for nav badges — matches the Pre-forecast intake tab filter per role. */
export function preForecastActionQueueCount(list: TruckerPreForecastSubmissionDto[], role: string): number {
  return filterPreForecastQueue(list, role).length;
}
