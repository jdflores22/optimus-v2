/** Detail page for a trucker intake pre-forecast submission. */
export function preForecastDetailPath(id: string) {
  return `/pre-forecast/${id}`;
}

/** Accounting detention billing review for a pre-forecast submission. */
export function preForecastBillingPath(id: string) {
  return `/pre-forecast/${id}/billing`;
}

/** Broker/consignee detention billing view and payment for a pre-forecast submission. */
export function preForecastDetentionPaymentPath(id: string) {
  return `/pre-forecast/${id}/detention-payment`;
}

type PreForecastNotificationRef = {
  title?: string;
  category?: string;
  subjectType?: string | null;
  subjectId?: string | null;
};

export function isPreForecastDetentionBrokerNotification(
  n: PreForecastNotificationRef,
  role?: string,
): boolean {
  if (!['Broker', 'Consignee'].includes(role ?? '')) return false;
  if (n.subjectType !== 'TruckerPreForecastSubmission' || !n.subjectId) return false;
  const cat = (n.category ?? '').toLowerCase();
  if (cat !== 'trucker_pre_forecast' && cat !== 'yard.pre_forecast') return false;
  return (n.title ?? '').toLowerCase().includes('detention');
}

/** Deep-link from an alert into the correct pre-forecast screen for the viewer's role. */
export function resolvePreForecastNotificationPath(
  n: PreForecastNotificationRef,
  role?: string,
): string | null {
  if (n.subjectType !== 'TruckerPreForecastSubmission' || !n.subjectId) return null;

  const title = (n.title ?? '').toLowerCase();
  if (role === 'Accounting' || role === 'SystemAdmin') {
    if (title.includes('finalize detention') || title.includes('detention billing')) {
      return preForecastBillingPath(n.subjectId);
    }
  }

  if (isPreForecastDetentionBrokerNotification(n, role)) {
    return preForecastDetentionPaymentPath(n.subjectId);
  }

  return preForecastDetailPath(n.subjectId);
}
