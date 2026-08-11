/**
 * Frontend route access — single source of truth for role boundaries.
 * Platform admin (SystemAdmin) ≠ shipping-line operations.
 */

import { brokerRouteRequiresAccreditation, type NavAccessOptions } from './brokerAccreditation';

export const APP_ROLES = [
  'SystemAdmin',
  'ShippingLinesAdmin',
  'SlStaff',
  'Evaluator',
  'Accounting',
  'TerminalTeam',
  'CyStaff',
  'Broker',
  'Consignee',
  'Trucker',
] as const;

export type AppRole = (typeof APP_ROLES)[number];

type RouteRule = {
  pattern: RegExp;
  roles: readonly string[];
};

const COMMON = APP_ROLES;

const MANIFEST_VIEW = ['ShippingLinesAdmin', 'SlStaff', 'Accounting', 'Broker', 'Consignee'] as const;
const MANIFEST_STAFF = ['ShippingLinesAdmin', 'SlStaff'] as const;
const MANIFEST_BROKER = ['Broker', 'Consignee'] as const;
const PAYMENTS_PAGE = ['Accounting', 'Broker', 'Consignee'] as const;
const EDO_LIST = ['ShippingLinesAdmin', 'SlStaff', 'Broker', 'Consignee'] as const;
const EDO_RENEWALS = ['ShippingLinesAdmin', 'SlStaff', 'Accounting', 'Broker', 'Consignee', 'Trucker'] as const;
const EDO_RELEASE = ['SlStaff', 'ShippingLinesAdmin', 'TerminalTeam', 'SystemAdmin'] as const;
/** Matches backend EnsureEdoAccessAsync — staff, terminal, accounting, plus broker/consignee owners. */
const EDO_DETAIL = [
  ...EDO_LIST,
  'Trucker',
  'SystemAdmin',
  'TerminalTeam',
  'Accounting',
] as const;
const EDO_PAY_TO_OPEN = ['Trucker', 'Broker', 'Consignee'] as const;
const YARD_STAFF = ['ShippingLinesAdmin', 'SlStaff', 'TerminalTeam'] as const;
const INVENTORY = ['ShippingLinesAdmin', 'SlStaff', 'Accounting', 'TerminalTeam', 'CyStaff', 'SystemAdmin'] as const;
const OPS_REPOSITION = ['ShippingLinesAdmin', 'SlStaff', 'TerminalTeam', 'SystemAdmin'] as const;
const STAFF_AUDIT = ['ShippingLinesAdmin', 'SlStaff', 'Evaluator', 'Accounting'] as const;
const ADMIN_HIERARCHY = ['SystemAdmin', 'ShippingLinesAdmin', 'SlStaff', 'Evaluator', 'Accounting'] as const;

/** Most specific patterns first. */
const ROUTE_RULES: RouteRule[] = [
  { pattern: /^\/workspace(\/referral)?$/, roles: ['Broker'] },

  { pattern: /^\/admin\/users$/, roles: ['SystemAdmin'] },
  { pattern: /^\/admin\/audit-logs$/, roles: ['SystemAdmin'] },
  { pattern: /^\/admin\/edo-audit$/, roles: ['SystemAdmin'] },
  { pattern: /^\/admin\/terminals$/, roles: ['SystemAdmin'] },
  { pattern: /^\/admin\/terminals\/[^/]+$/, roles: ['SystemAdmin'] },
  { pattern: /^\/admin\/teu-contracts$/, roles: ['SystemAdmin'] },
  { pattern: /^\/admin\/container-types$/, roles: ['SystemAdmin'] },
  { pattern: /^\/admin\/container-sizes$/, roles: ['SystemAdmin'] },
  { pattern: /^\/admin\/form-builder$/, roles: ['SystemAdmin'] },
  { pattern: /^\/admin\/document-templates$/, roles: ['SystemAdmin'] },
  { pattern: /^\/admin\/payment-fees$/, roles: ['SystemAdmin'] },
  { pattern: /^\/admin\/detention-rate$/, roles: ['SystemAdmin', 'ShippingLinesAdmin', 'Accounting'] },
  { pattern: /^\/admin\/reports\/cy-utilization$/, roles: ['SystemAdmin'] },
  { pattern: /^\/admin\/reports\/port-utilization$/, roles: ['SystemAdmin'] },
  { pattern: /^\/admin\/notification-metrics$/, roles: ['SystemAdmin'] },
  { pattern: /^\/admin\/system-settings$/, roles: ['SystemAdmin'] },
  { pattern: /^\/admin\/edo-release(\/queue|\/revenue)?$/, roles: ['SystemAdmin'] },
  { pattern: /^\/admin\/platform$/, roles: ['SystemAdmin', 'ShippingLinesAdmin'] },
  { pattern: /^\/admin\/shipping-lines$/, roles: ['SystemAdmin', 'ShippingLinesAdmin'] },
  { pattern: /^\/admin\/hierarchy$/, roles: ADMIN_HIERARCHY },

  { pattern: /^\/shipping-admin\/consignees(\/[^/]+)?$/, roles: ['ShippingLinesAdmin'] },
  { pattern: /^\/shipping-admin\/brokers(\/[^/]+)?$/, roles: ['ShippingLinesAdmin'] },
  { pattern: /^\/shipping-admin\/appeals$/, roles: ['ShippingLinesAdmin'] },
  { pattern: /^\/shipping-admin\/transfers$/, roles: ['ShippingLinesAdmin', 'SlStaff'] },
  { pattern: /^\/admin\/appeals$/, roles: ['ShippingLinesAdmin'] },
  { pattern: /^\/admin\/transfers$/, roles: ['ShippingLinesAdmin', 'SlStaff'] },
  { pattern: /^\/approvals$/, roles: ['ShippingLinesAdmin'] },
  { pattern: /^\/evaluator\/application\/[^/]+$/, roles: ['Evaluator', 'ShippingLinesAdmin', 'SystemAdmin'] },

  { pattern: /^\/manifests\/create$/, roles: MANIFEST_STAFF },
  { pattern: /^\/manifests\/bulk-import(-manifests)?$/, roles: MANIFEST_STAFF },
  { pattern: /^\/manifests\/[^/]+\/generate-manifest$/, roles: MANIFEST_STAFF },
  { pattern: /^\/manifests\/[^/]+\/upload-bl$/, roles: MANIFEST_BROKER },
  { pattern: /^\/manifests\/[^/]+\/generate-billing$/, roles: ['Accounting'] },
  { pattern: /^\/manifests\/[^/]+\/final-payment$/, roles: MANIFEST_BROKER },
  { pattern: /^\/manifests\/[^/]+\/edo-payment\/[^/]+$/, roles: MANIFEST_BROKER },
  {
    pattern: /^\/manifests\/[^/]+\/payment-history$/,
    roles: ['Broker', 'Consignee', 'Accounting', 'ShippingLinesAdmin', 'SlStaff'],
  },
  { pattern: /^\/manifests(\/[^/]+)?$/, roles: MANIFEST_VIEW },

  { pattern: /^\/payments\/final\/[^/]+$/, roles: ['Accounting'] },
  { pattern: /^\/payments$/, roles: PAYMENTS_PAGE },
  { pattern: /^\/manifest-payments$/, roles: MANIFEST_BROKER },

  { pattern: /^\/edo\/payment-validation(\/[^/]+)?$/, roles: ['Accounting', 'SystemAdmin'] },
  { pattern: /^\/edo\/release(\/payments\/[^/]+)?$/, roles: EDO_RELEASE },
  { pattern: /^\/edo\/renewals$/, roles: EDO_RENEWALS },
  { pattern: /^\/edo$/, roles: EDO_LIST },
  { pattern: /^\/edo\/[^/]+\/payment$/, roles: EDO_PAY_TO_OPEN },
  { pattern: /^\/edo\/[^/]+$/, roles: EDO_DETAIL },

  { pattern: /^\/trucker\/payments$/, roles: ['Trucker'] },

  { pattern: /^\/pre-forecast\/yard$/, roles: ['CyStaff'] },
  {
    pattern: /^\/pre-forecast\/submissions\/[^/]+\/review$/,
    roles: ['ShippingLinesAdmin', 'SlStaff', 'TerminalTeam', 'SystemAdmin'],
  },
  {
    pattern: /^\/pre-forecast\/[0-9a-f-]{36}\/billing$/,
    roles: ['Accounting', 'SystemAdmin'],
  },
  {
    pattern: /^\/pre-forecast\/[0-9a-f-]{36}\/detention-payment$/,
    roles: ['Broker', 'Consignee', 'SystemAdmin'],
  },
  {
    pattern: /^\/pre-forecast\/(submissions\/[^/]+|[0-9a-f-]{36})$/,
    roles: ['ShippingLinesAdmin', 'SlStaff', 'TerminalTeam', 'Trucker', 'CyStaff', 'Accounting', 'SystemAdmin'],
  },
  { pattern: /^\/pre-forecast$/, roles: ['ShippingLinesAdmin', 'SlStaff', 'TerminalTeam', 'Trucker', 'CyStaff', 'Accounting', 'SystemAdmin'] },
  { pattern: /^\/container-inventory$/, roles: INVENTORY },
  { pattern: /^\/container\/[^/]+\/details$/, roles: INVENTORY },
  { pattern: /^\/yard$/, roles: YARD_STAFF },
  { pattern: /^\/dwell$/, roles: YARD_STAFF },
  { pattern: /^\/reports\/utilization$/, roles: YARD_STAFF },

  { pattern: /^\/sas$/, roles: ['ShippingLinesAdmin', 'SlStaff', 'Evaluator', 'Broker', 'Consignee'] },
  { pattern: /^\/transfers$/, roles: ['ShippingLinesAdmin', 'SlStaff', 'Consignee', 'Broker'] },
  { pattern: /^\/appeals$/, roles: ['ShippingLinesAdmin', 'Broker'] },
  { pattern: /^\/brokers$/, roles: ['Consignee'] },
  { pattern: /^\/repositioning\/new$/, roles: ['ShippingLinesAdmin', 'SlStaff'] },
  { pattern: /^\/repositioning(\/[^/]+)?$/, roles: OPS_REPOSITION },

  { pattern: /^\/reports\/audit$/, roles: STAFF_AUDIT },
  { pattern: /^\/notifications(\/[^/]+)?$/, roles: COMMON },
  { pattern: /^\/profile$/, roles: COMMON },
  { pattern: /^\/$/, roles: COMMON },
];

function normalizePath(pathname: string): string {
  if (!pathname) return '/';
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed || '/';
}

export function canAccessRoute(
  pathname: string,
  role: string | undefined | null,
  options?: NavAccessOptions,
): boolean {
  const r = role ?? '';
  if (!r) return false;

  const path = normalizePath(pathname);

  if (r === 'Broker' && options?.brokerAccredited === false && brokerRouteRequiresAccreditation(path)) {
    return false;
  }

  for (const rule of ROUTE_RULES) {
    if (rule.pattern.test(path)) {
      return rule.roles.includes(r);
    }
  }

  return false;
}

/** Drop dashboard / CTA links the current role cannot open. */
export function filterAccessibleLinks<T extends { to: string }>(
  items: T[],
  role: string | undefined | null,
  options?: NavAccessOptions,
): T[] {
  return items.filter((item) => canAccessRoute(item.to, role, options));
}

export function getAccessDeniedRedirect(role: string | undefined | null, pathname?: string): string {
  if (role === 'Broker') {
    if (pathname && brokerRouteRequiresAccreditation(pathname)) return '/sas';
    return '/workspace';
  }
  return '/';
}
