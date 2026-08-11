/** Detention amounts are for shipping line / accounting — not shown to CY depot staff. */
export function canViewPreForecastDetention(role: string): boolean {
  return ['ShippingLinesAdmin', 'SlStaff', 'Accounting', 'SystemAdmin', 'Trucker'].includes(role);
}

/** Full trucker renewal workflow (accounting, broker pay, new CRO/eDO) — not shown to CY. */
export function canViewPreForecastTruckerWorkflow(role: string): boolean {
  return role !== 'CyStaff';
}

export function cyDepotStatusLabel(status: string, needsConfirm: boolean, hasCyConfirmed: boolean): string {
  if (needsConfirm || status === 'PendingCySchedule') return 'Confirm return date';
  if (status === 'Cancelled') return 'Declined';
  if (hasCyConfirmed) return 'Schedule confirmed';
  return 'No action needed';
}

export function cyDepotStatusHint(status: string, hasCyConfirmed: boolean): string {
  if (hasCyConfirmed) return 'Handed off to shipping line for renewal';
  if (status === 'PendingCySchedule') return 'Pick the day your yard can accept this empty';
  return 'Depot assignment';
}
