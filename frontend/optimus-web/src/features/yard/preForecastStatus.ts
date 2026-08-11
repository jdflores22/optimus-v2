import { edoPaymentSubmitted } from '../../shared/formatEdoStatus';
import type { TruckerPreForecastSubmissionDto } from '../../shared/types';

export const PRE_FORECAST_STATUS_LABELS: Record<string, string> = {
  PendingTerminalAssignment: 'Awaiting CY assignment',
  PendingCySchedule: 'Awaiting CY schedule',
  CyScheduleConfirmed: 'CY schedule confirmed',
  PendingAccountingReview: 'Accounting review',
  AwaitingDetentionPayment: 'Awaiting detention payment',
  PendingReview: 'Renewal review',
  AwaitingRenewalPayment: 'Pay to open new CRO/eDO',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
  ReadyForProcessing: 'Processing',
};

/** Trucker uploaded renewed eDO pay-to-open receipt — accounting has not validated yet. */
export function preForecastRenewalPaymentSubmitted(
  submission: Pick<TruckerPreForecastSubmissionDto, 'status' | 'newEdoId' | 'renewalEdoPaymentStatus'>,
): boolean {
  if (submission.status !== 'AwaitingRenewalPayment' || !submission.newEdoId) {
    return false;
  }
  return edoPaymentSubmitted(submission.renewalEdoPaymentStatus);
}

/** Header chip / queue label with payment-aware states. */
export function preForecastDisplayStatus(submission: TruckerPreForecastSubmissionDto): string {
  if (preForecastRenewalPaymentSubmitted(submission)) {
    return 'eDO payment validating';
  }
  if (submission.status === 'AwaitingDetentionPayment' && submission.detentionPaymentReceiptSubmitted) {
    return 'Validate detention payment';
  }
  return preForecastStatusLabel(submission.status);
}

export function preForecastDisplayStatusColor(
  submission: TruckerPreForecastSubmissionDto,
): 'default' | 'warning' | 'info' | 'success' | 'error' {
  if (preForecastRenewalPaymentSubmitted(submission)) {
    return 'info';
  }
  if (submission.status === 'AwaitingDetentionPayment' && submission.detentionPaymentReceiptSubmitted) {
    return 'info';
  }
  return preForecastStatusColor(submission.status);
}

export function preForecastStatusLabel(status: string): string {
  return PRE_FORECAST_STATUS_LABELS[status] ?? status;
}

export function preForecastStatusColor(
  status: string,
): 'default' | 'warning' | 'info' | 'success' | 'error' {
  if (status === 'Completed') return 'success';
  if (status === 'Cancelled') return 'error';
  if (status.includes('Pending') || status.includes('Awaiting')) return 'warning';
  if (status.includes('Confirmed')) return 'info';
  return 'default';
}

/** Queue display when broker receipt is in but accounting has not verified yet. */
export function preForecastQueueStatusLabel(
  status: string,
  detentionPaymentReceiptSubmitted?: boolean,
): string {
  if (status === 'AwaitingDetentionPayment' && detentionPaymentReceiptSubmitted) {
    return 'Validate detention payment';
  }
  return preForecastStatusLabel(status);
}

export function preForecastQueueStatusColor(
  status: string,
  detentionPaymentReceiptSubmitted?: boolean,
): 'default' | 'warning' | 'info' | 'success' | 'error' {
  if (status === 'AwaitingDetentionPayment' && detentionPaymentReceiptSubmitted) {
    return 'info';
  }
  return preForecastStatusColor(status);
}

/** Extra CY schedule-day detention is only undecided while accounting is reviewing billing. */
export function isScheduleDeltaPendingAccountingDecision(status: string): boolean {
  return status === 'PendingAccountingReview';
}

export const WORKFLOW_STEPS = [
  {
    key: 'PendingTerminalAssignment',
    label: 'Terminal assigns CY',
    detail: 'Shipping line / terminal staff pick a container yard with available allocation or slot.',
    actor: 'Terminal team',
  },
  {
    key: 'PendingCySchedule',
    label: 'CY confirms schedule',
    detail: 'Assigned CY confirms they can accept the empty return on the agreed free-day date.',
    actor: 'CY staff',
  },
  {
    key: 'PendingAccountingReview',
    label: 'Accounting finalizes detention',
    detail: 'Detention is computed or adjusted after CY confirmation when the CRO/eDO is past free time.',
    actor: 'Accounting',
  },
  {
    key: 'AwaitingDetentionPayment',
    label: 'Broker pays detention',
    detail: 'Broker or consignee settles detention charges before renewal can proceed.',
    actor: 'Broker / consignee',
  },
  {
    key: 'PendingReview',
    label: 'Staff generates renewed CRO/eDO',
    detail: 'Shipping line staff issue a renewed release document after billing is cleared.',
    actor: 'Shipping line',
  },
  {
    key: 'AwaitingRenewalPayment',
    label: 'Pay to open new CRO/eDO',
    detail: 'Trucker pays the eDO access fee — accounting validates before the renewed document can be opened.',
    actor: 'Trucker',
  },
  {
    key: 'Completed',
    label: 'Completed',
    detail: 'Empty return pre-forecast is fully processed and the renewed CRO/eDO is available.',
    actor: 'Done',
  },
] as const;

export type WorkflowStepState = 'complete' | 'current' | 'upcoming' | 'cancelled';

export function workflowStepIndex(status: string): number {
  const idx = WORKFLOW_STEPS.findIndex((s) => s.key === status);
  if (idx >= 0) return idx;
  if (status === 'CyScheduleConfirmed') return 2;
  if (status === 'ReadyForProcessing') return 0;
  return 0;
}

export function getWorkflowStepState(status: string, stepIndex: number): WorkflowStepState {
  if (status === 'Cancelled') return stepIndex === 0 ? 'cancelled' : 'upcoming';
  if (status === 'Completed') return 'complete';
  const current = workflowStepIndex(status);
  if (stepIndex < current) return 'complete';
  if (stepIndex === current) return 'current';
  return 'upcoming';
}

export function workflowProgressPercent(
  status: string,
  options?: { renewalPaymentSubmitted?: boolean },
): number {
  if (status === 'Completed') return 100;
  if (status === 'Cancelled') return 0;
  const current = workflowStepIndex(status);
  if (status === 'AwaitingRenewalPayment' && options?.renewalPaymentSubmitted) {
    return Math.round(((current + 0.8) / (WORKFLOW_STEPS.length - 1)) * 100);
  }
  return Math.round((current / (WORKFLOW_STEPS.length - 1)) * 100);
}
