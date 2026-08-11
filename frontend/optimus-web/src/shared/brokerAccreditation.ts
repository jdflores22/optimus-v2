import type { AccreditationDto } from './types';

export type NavAccessOptions = {
  brokerAccredited?: boolean;
};

export function isBrokerAccredited(
  accreditations: AccreditationDto[],
  userId: string | undefined | null,
): boolean {
  if (!userId) return false;
  return accreditations.some(
    (a) => a.applicantId === userId && a.status === 'Approved',
  );
}

const BROKER_ACCREDITATION_PATHS = [
  /^\/manifests(\/|$)/,
  /^\/manifest-payments$/,
  /^\/edo(\/|$)/,
  /^\/payments(\/|$)/,
  /^\/transfers$/,
  /^\/appeals$/,
  /^\/repositioning(\/|$)/,
];

export function brokerRouteRequiresAccreditation(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/';
  return BROKER_ACCREDITATION_PATHS.some((pattern) => pattern.test(path));
}
