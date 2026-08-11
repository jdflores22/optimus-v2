import type { TruckerPreForecastSubmissionDto } from '../../shared/types';
import { edoNeedsPayment, edoPaymentRejected, edoPaymentSubmitted } from '../../shared/formatEdoStatus';

/** Pre-forecast submission where the trucker still owes the renewed eDO pay-to-open fee. */
export function truckerNeedsRenewalEdoPayment(submission: TruckerPreForecastSubmissionDto): boolean {
  if (submission.status !== 'AwaitingRenewalPayment' || !submission.newEdoId) {
    return false;
  }
  return edoNeedsPayment(submission.renewalEdoStatus ?? 'PendingValidation', submission.renewalEdoPaymentStatus);
}

export function filterTruckerPendingEdoPayments(
  submissions: TruckerPreForecastSubmissionDto[],
): TruckerPreForecastSubmissionDto[] {
  return submissions.filter(truckerNeedsRenewalEdoPayment);
}

export function countTruckerPendingEdoPayments(submissions: TruckerPreForecastSubmissionDto[]): number {
  return filterTruckerPendingEdoPayments(submissions).length;
}

/** Receipt uploaded — accounting has not validated yet. */
export function truckerRenewalEdoPaymentPendingValidation(
  submission: TruckerPreForecastSubmissionDto,
): boolean {
  if (submission.status !== 'AwaitingRenewalPayment' || !submission.newEdoId) {
    return false;
  }
  return edoPaymentSubmitted(submission.renewalEdoPaymentStatus);
}

export function filterTruckerRenewalEdoPaymentsAwaitingValidation(
  submissions: TruckerPreForecastSubmissionDto[],
): TruckerPreForecastSubmissionDto[] {
  return submissions.filter(truckerRenewalEdoPaymentPendingValidation);
}

export function truckerRenewalEdoPaymentRejected(submission: TruckerPreForecastSubmissionDto): boolean {
  return (
    truckerNeedsRenewalEdoPayment(submission) && edoPaymentRejected(submission.renewalEdoPaymentStatus)
  );
}
