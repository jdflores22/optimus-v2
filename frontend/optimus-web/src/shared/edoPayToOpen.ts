import type { EdoDto } from './types';
import { edoNeedsPayment, edoPaymentSubmitted } from './formatEdoStatus';

const CARGO_ROLES = ['Trucker', 'Broker', 'Consignee'] as const;

export function isPreForecastRenewalEdo(edo: EdoDto): boolean {
  return Boolean(edo.isRenewed || edo.preForecastSubmissionId || edo.renewalPayorRole === 'Trucker');
}

/** Who must pay the pay-to-open fee for this document. */
export function edoPayToOpenPayorRole(edo: EdoDto): 'Trucker' | 'BrokerOrConsignee' {
  if (isPreForecastRenewalEdo(edo)) return 'Trucker';
  return 'BrokerOrConsignee';
}

export function shouldShowEdoPayToOpenNotice(role?: string | null): boolean {
  return CARGO_ROLES.includes(role as (typeof CARGO_ROLES)[number]);
}

export function canSubmitEdoPayToOpen(role: string | undefined | null, edo: EdoDto): boolean {
  if (!edoNeedsPayment(edo.status, edo.currentPaymentStatus)) return false;
  const payor = edoPayToOpenPayorRole(edo);
  if (payor === 'Trucker') return role === 'Trucker';
  return role === 'Broker' || role === 'Consignee';
}

export function edoPayToOpenNotice(
  role: string | undefined | null,
  edo: EdoDto,
  feeLabel: string,
): { severity: 'warning' | 'info'; title: string; body: string } | null {
  if (!shouldShowEdoPayToOpenNotice(role)) return null;
  if (!edoNeedsPayment(edo.status, edo.currentPaymentStatus)) {
    if (edoPaymentSubmitted(edo.currentPaymentStatus)) {
      return {
        severity: 'info',
        title: 'Payment submitted',
        body: 'Accounting is validating your receipt. Download will unlock after verification and release.',
      };
    }
    return null;
  }

  const payor = edoPayToOpenPayorRole(edo);
  if (payor === 'Trucker') {
    if (role === 'Trucker') {
      return {
        severity: 'warning',
        title: 'Pay to open this renewed eDO',
        body: `Upload proof of the ${feeLabel} eDO access fee on the payment page. Accounting must validate payment before this renewed CRO/eDO can be downloaded.`,
      };
    }
    return {
      severity: 'warning',
      title: 'Payment required from trucker',
      body: `This renewed CRO/eDO cannot be opened until the trucker who submitted the pre-forecast pays the ${feeLabel} access fee and accounting validates the receipt.`,
    };
  }

  if (role === 'Trucker') {
    return {
      severity: 'info',
      title: 'Broker or consignee pays this fee',
      body: `The manifest broker or consignee must pay the ${feeLabel} eDO access fee before this document can be downloaded.`,
    };
  }

  return {
    severity: 'warning',
    title: 'Pay to open this eDO',
    body: `Upload proof of the ${feeLabel} eDO access fee on the Payment tab. Download unlocks after accounting validates payment.`,
  };
}
