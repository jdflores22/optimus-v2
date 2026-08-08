import type { EdoDto, EdoPaymentDto, ManifestDto, NotificationDto, PaymentDto } from './types';
import {
  edoNeedsPayment,
  edoPaymentRejected,
  edoPaymentSubmitted,
  edoPaymentVerified,
} from './formatEdoStatus';
import { formatWorkflowState } from './formatWorkflowState';

export type NotificationPaymentAction = {
  path: string;
  label: string;
  variant?: 'contained' | 'outlined';
};

export type NotificationPaymentState = {
  statusLabel: string;
  statusTone: 'success' | 'warning' | 'error' | 'info' | 'default';
  isPaid: boolean;
  isPending: boolean;
  isRejected: boolean;
  needsPayment: boolean;
  primaryAction: NotificationPaymentAction | null;
  secondaryAction?: NotificationPaymentAction | null;
};

function isFinalPayment(p: PaymentDto) {
  return /final/i.test(p.paymentType);
}

function latestFinalPayment(payments: PaymentDto[]) {
  return [...payments]
    .filter(isFinalPayment)
    .sort(
      (a, b) =>
        (a.version ?? 0) - (b.version ?? 0) ||
        +new Date(a.createdAt) - +new Date(b.createdAt),
    )
    .slice(-1)[0];
}

function pendingFinalPayment(payments: PaymentDto[]) {
  return payments.find((p) => isFinalPayment(p) && /pending/i.test(p.status));
}

export function manifestIdFromNotification(n: NotificationDto): string | null {
  if (n.subjectType === 'Manifest' && n.subjectId) return n.subjectId;
  return null;
}

export function isBillingNotification(n: NotificationDto): boolean {
  const cat = (n.category ?? '').toLowerCase();
  const title = n.title.toLowerCase();
  return cat === 'billing' || title.includes('billing generated');
}

export function isEdoPaymentNotification(n: NotificationDto): boolean {
  const cat = (n.category ?? '').toLowerCase();
  if (/edo[_-]?payment/.test(cat)) return true;
  if (n.subjectType === 'EdoPayment') return true;

  const combined = `${n.title} ${n.message}`.toLowerCase();
  if (/edo payment (submitted|approved|rejected|required)/.test(combined)) return true;
  if (/edo access fee|pay the edo|edo payment receipt/.test(combined)) return true;

  return (
    n.subjectType === 'ElectronicDeliveryOrder' &&
    /payment|receipt|access fee|validation/.test(combined)
  );
}

export function isFinalPaymentRejectedNotification(n: NotificationDto): boolean {
  if (isBillingNotification(n) || isEdoPaymentNotification(n)) return false;

  const cat = (n.category ?? '').toLowerCase();
  const combined = `${n.title} ${n.message}`.toLowerCase();
  return (
    (cat.includes('payment') && /reject/.test(combined)) ||
    combined.includes('payment rejected') ||
    combined.includes('final payment rejected')
  );
}

function canSubmitManifestPayment(role: string) {
  return role === 'Broker' || role === 'Consignee';
}

function resolveEdoId(
  n: NotificationDto,
  edos: EdoDto[],
  edoFromSubject?: EdoDto | null,
  edoPaymentFromSubject?: EdoPaymentDto | null,
): string | null {
  if (n.subjectType === 'ElectronicDeliveryOrder' && n.subjectId) return n.subjectId;
  if (edoFromSubject?.id) return edoFromSubject.id;
  if (edoPaymentFromSubject?.edoId) return edoPaymentFromSubject.edoId;

  const combined = `${n.title} ${n.message}`;
  const edoNumberMatch = combined.match(/\beDO[-\s]?(\d+)/i);
  if (edoNumberMatch) {
    const needle = edoNumberMatch[0].replace(/\s+/g, '');
    const matched = edos.find((e) => e.edoNumber.replace(/\s+/g, '') === needle);
    if (matched) return matched.id;
  }

  const actionable = edos.find(
    (e) => edoNeedsPayment(e.status, e.currentPaymentStatus) || edoPaymentRejected(e.currentPaymentStatus),
  );
  return actionable?.id ?? edos[0]?.id ?? null;
}

function resolveEdo(
  edoId: string | null,
  edos: EdoDto[],
  edoFromSubject?: EdoDto | null,
): EdoDto | null {
  if (edoFromSubject) return edoFromSubject;
  if (!edoId) return null;
  return edos.find((e) => e.id === edoId) ?? null;
}

function isEdoPaymentSubmittedNotification(n: NotificationDto): boolean {
  const cat = (n.category ?? '').toLowerCase();
  const combined = `${n.title} ${n.message}`.toLowerCase();
  return cat.includes('submitted') || combined.includes('edo payment submitted');
}

function manifestPaymentHistoryPath(manifestId: string): string {
  return `/manifests/${manifestId}/payment-history`;
}

function manifestDocumentsPath(manifestId: string): string {
  return `/manifests/${manifestId}?tab=documents`;
}

function resolveBillingPaymentState(
  role: string,
  manifestId: string,
  manifest: ManifestDto,
  payments: PaymentDto[],
): NotificationPaymentState {
  const latest = latestFinalPayment(payments);
  const pending = pendingFinalPayment(payments);
  const ws = manifest.workflowState;
  const historyAction: NotificationPaymentAction = {
    path: manifestPaymentHistoryPath(manifestId),
    label: 'View payment history',
    variant: 'outlined',
  };

  if (
    /PaymentVerified|EdoGenerated|EdoReleased/i.test(ws) ||
    (latest && /verif/i.test(latest.status))
  ) {
    return {
      statusLabel: 'Billing payment verified',
      statusTone: 'success',
      isPaid: true,
      isPending: false,
      isRejected: false,
      needsPayment: false,
      primaryAction: historyAction,
    };
  }

  if (/PaymentSubmitted/i.test(ws) || pending) {
    return {
      statusLabel: 'Payment submitted — awaiting validation',
      statusTone: 'warning',
      isPaid: false,
      isPending: true,
      isRejected: false,
      needsPayment: false,
      primaryAction: historyAction,
    };
  }

  if (latest && /reject/i.test(latest.status) && ws === 'BillingGenerated') {
    return {
      statusLabel: 'Payment rejected — resubmission required',
      statusTone: 'error',
      isPaid: false,
      isPending: false,
      isRejected: true,
      needsPayment: canSubmitManifestPayment(role),
      primaryAction: canSubmitManifestPayment(role)
        ? {
            path: `/manifests/${manifestId}/final-payment`,
            label: 'Resubmit payment',
            variant: 'contained',
          }
        : historyAction,
      secondaryAction: canSubmitManifestPayment(role) ? historyAction : null,
    };
  }

  if (
    ws === 'BillingGenerated' &&
    manifest.billingPdfPath &&
    canSubmitManifestPayment(role) &&
    (!latest || /reject/i.test(latest.status))
  ) {
    return {
      statusLabel: 'Payment required',
      statusTone: 'warning',
      isPaid: false,
      isPending: false,
      isRejected: false,
      needsPayment: true,
      primaryAction: {
        path: `/manifests/${manifestId}/final-payment`,
        label: 'Submit billing payment',
        variant: 'contained',
      },
    };
  }

  return {
    statusLabel: formatWorkflowState(ws),
    statusTone: 'info',
    isPaid: false,
    isPending: false,
    isRejected: false,
    needsPayment: false,
    primaryAction: {
      path: `/manifests/${manifestId}`,
      label: 'Open manifest',
      variant: 'outlined',
    },
  };
}

function resolveEdoPaymentState(input: {
  notification: NotificationDto;
  role: string;
  manifestId: string;
  edos: EdoDto[];
  edoFromSubject?: EdoDto | null;
  edoPaymentFromSubject?: EdoPaymentDto | null;
  pendingEdoPayments: EdoPaymentDto[];
}): NotificationPaymentState {
  const { notification: n, role, manifestId, edos, edoFromSubject, edoPaymentFromSubject, pendingEdoPayments } =
    input;

  const edoId = resolveEdoId(n, edos, edoFromSubject, edoPaymentFromSubject);
  const edo = resolveEdo(edoId, edos, edoFromSubject);
  const documentsAction: NotificationPaymentAction = {
    path: manifestDocumentsPath(manifestId),
    label: 'View eDO status',
    variant: 'outlined',
  };

  if (role === 'SystemAdmin' && isEdoPaymentSubmittedNotification(n)) {
    const paymentId =
      (n.subjectType === 'EdoPayment' && n.subjectId ? n.subjectId : null) ??
      edoPaymentFromSubject?.id ??
      pendingEdoPayments.find(
        (p) =>
          (edoId && p.edoId === edoId) ||
          p.manifestId === manifestId ||
          (n.subjectId && p.id === n.subjectId),
      )?.id;

    const linkedPayment =
      edoPaymentFromSubject ??
      pendingEdoPayments.find((p) => p.id === paymentId) ??
      null;

    if (linkedPayment && /pending/i.test(linkedPayment.status)) {
      return {
        statusLabel: 'eDO payment awaiting review',
        statusTone: 'warning',
        isPaid: false,
        isPending: true,
        isRejected: false,
        needsPayment: false,
        primaryAction: {
          path: `/edo/payment-validation/${linkedPayment.id}`,
          label: 'Review eDO payment',
          variant: 'contained',
        },
      };
    }

    if (linkedPayment && /verif/i.test(linkedPayment.status)) {
      return {
        statusLabel: 'eDO payment verified',
        statusTone: 'success',
        isPaid: true,
        isPending: false,
        isRejected: false,
        needsPayment: false,
        primaryAction: {
          path: `/edo/payment-validation/${linkedPayment.id}`,
          label: 'View payment review',
          variant: 'outlined',
        },
      };
    }

    if (linkedPayment && /reject/i.test(linkedPayment.status)) {
      return {
        statusLabel: 'eDO payment rejected',
        statusTone: 'error',
        isPaid: false,
        isPending: false,
        isRejected: true,
        needsPayment: false,
        primaryAction: {
          path: `/edo/payment-validation/${linkedPayment.id}`,
          label: 'View rejection details',
          variant: 'outlined',
        },
      };
    }

    if (paymentId && pendingEdoPayments.some((p) => p.id === paymentId)) {
      return {
        statusLabel: 'eDO payment awaiting review',
        statusTone: 'warning',
        isPaid: false,
        isPending: true,
        isRejected: false,
        needsPayment: false,
        primaryAction: {
          path: `/edo/payment-validation/${paymentId}`,
          label: 'Review eDO payment',
          variant: 'contained',
        },
      };
    }

    return {
      statusLabel: 'eDO payment already reviewed',
      statusTone: 'success',
      isPaid: true,
      isPending: false,
      isRejected: false,
      needsPayment: false,
      primaryAction: {
        path: '/edo/payment-validation',
        label: 'Open payment validation queue',
        variant: 'outlined',
      },
    };
  }

  if (edo) {
    if (edoPaymentVerified(edo.currentPaymentStatus) || /pendingrelease|released|active/i.test(edo.status)) {
      return {
        statusLabel: 'eDO payment verified',
        statusTone: 'success',
        isPaid: true,
        isPending: false,
        isRejected: false,
        needsPayment: false,
        primaryAction: documentsAction,
      };
    }

    if (edoPaymentSubmitted(edo.currentPaymentStatus)) {
      return {
        statusLabel: 'eDO payment submitted — awaiting validation',
        statusTone: 'warning',
        isPaid: false,
        isPending: true,
        isRejected: false,
        needsPayment: false,
        primaryAction: documentsAction,
      };
    }

    if (edoPaymentRejected(edo.currentPaymentStatus)) {
      return {
        statusLabel: 'eDO payment rejected — resubmission required',
        statusTone: 'error',
        isPaid: false,
        isPending: false,
        isRejected: true,
        needsPayment: canSubmitManifestPayment(role),
        primaryAction: canSubmitManifestPayment(role)
          ? {
              path: `/manifests/${manifestId}/edo-payment/${edo.id}`,
              label: 'Resubmit eDO payment',
              variant: 'contained',
            }
          : documentsAction,
        secondaryAction: canSubmitManifestPayment(role) ? documentsAction : null,
      };
    }

    if (edoNeedsPayment(edo.status, edo.currentPaymentStatus) && canSubmitManifestPayment(role)) {
      return {
        statusLabel: 'eDO payment required',
        statusTone: 'warning',
        isPaid: false,
        isPending: false,
        isRejected: false,
        needsPayment: true,
        primaryAction: {
          path: `/manifests/${manifestId}/edo-payment/${edo.id}`,
          label: 'Submit eDO payment',
          variant: 'contained',
        },
      };
    }
  }

  return {
    statusLabel: edo ? 'No payment action needed' : 'eDO payment status unavailable',
    statusTone: 'info',
    isPaid: false,
    isPending: false,
    isRejected: false,
    needsPayment: false,
    primaryAction: edoId && canSubmitManifestPayment(role)
      ? {
          path: `/manifests/${manifestId}/edo-payment/${edoId}`,
          label: 'Open eDO payment',
          variant: 'outlined',
        }
      : documentsAction,
  };
}

/** @deprecated Use resolveNotificationPaymentState for accurate paid/pending detection. */
export function resolveNotificationPaymentAction(input: {
  notification: NotificationDto;
  role: string;
  manifestId: string | null;
  edos?: EdoDto[];
  edoFromSubject?: EdoDto | null;
  edoPaymentFromSubject?: EdoPaymentDto | null;
  pendingEdoPayments?: EdoPaymentDto[];
}): NotificationPaymentAction | null {
  const state = resolveNotificationPaymentState({
    ...input,
    manifest: null,
    payments: [],
    edos: input.edos ?? [],
    pendingEdoPayments: input.pendingEdoPayments ?? [],
  });
  return state?.primaryAction ?? null;
}

export function resolveNotificationPaymentState(input: {
  notification: NotificationDto;
  role: string;
  manifestId: string | null;
  manifest?: ManifestDto | null;
  payments?: PaymentDto[];
  edos?: EdoDto[];
  edoFromSubject?: EdoDto | null;
  edoPaymentFromSubject?: EdoPaymentDto | null;
  pendingEdoPayments?: EdoPaymentDto[];
}): NotificationPaymentState | null {
  const {
    notification: n,
    role,
    manifestId,
    manifest,
    payments = [],
    edos = [],
    edoFromSubject,
    edoPaymentFromSubject,
    pendingEdoPayments = [],
  } = input;

  if (!manifestId) return null;

  if (isEdoPaymentNotification(n)) {
    return resolveEdoPaymentState({
      notification: n,
      role,
      manifestId,
      edos,
      edoFromSubject,
      edoPaymentFromSubject,
      pendingEdoPayments,
    });
  }

  if ((isBillingNotification(n) || isFinalPaymentRejectedNotification(n)) && manifest) {
    return resolveBillingPaymentState(role, manifestId, manifest, payments);
  }

  return null;
}
