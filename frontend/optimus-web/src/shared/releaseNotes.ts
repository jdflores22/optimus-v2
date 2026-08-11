export type ReleaseChangeType = 'added' | 'improved' | 'fixed' | 'infra' | 'security';

export type ReleaseChange = {
  type: ReleaseChangeType;
  text: string;
};

export type ReleaseNote = {
  version: string;
  date: string;
  title: string;
  summary: string;
  changes: ReleaseChange[];
};

/** Shipped frontend/API version. */
export const CURRENT_APP_VERSION = '0.7.0';

/** Next milestone on the progress report (not shipped). */
export const UPCOMING_APP_VERSION = '0.8.0';

export type RoadmapProduct = 'ICS' | 'OPTIMUS' | 'ICS + OPTIMUS';

export type RoadmapItemStatus = 'in_progress' | 'queued';

/** Manual v0.8.0 progress report — edit here; estimates are filled by the team, not auto-generated. */
export type RoadmapItem = {
  id: string;
  product: RoadmapProduct;
  status: RoadmapItemStatus;
  scope: string;
  /** Optional route or screen reference. */
  route?: string;
  /** Leave undefined until the team sets an estimate. */
  estimatedHours?: number;
};

export const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    id: 'ics-consignee-broker',
    product: 'ICS',
    status: 'in_progress',
    scope: 'Consignee link to broker — same relationship and approval flow as Optimus workflow.',
  },
  {
    id: 'ics-cro-edo-broker-notify',
    product: 'ICS',
    status: 'in_progress',
    route: '/evaluations/cro-edo/new',
    scope: 'CRO/eDO evaluation — add broker link on notifications so brokers are included in alerts.',
  },
  {
    id: 'ics-preforecast-return-date',
    product: 'ICS',
    status: 'in_progress',
    route: '/pre-forecast',
    scope:
      'Pre-forecast — trucker searches container, uploads expired CRO/eDO release, captures return date; detention billed to broker/consignee before new CRO/eDO.',
  },
  {
    id: 'plf-comparison',
    product: 'ICS + OPTIMUS',
    status: 'queued',
    scope:
      'Workflow comparison (PLF — Programming Language Formulation) — compare OPTIMUS (Enterprise) vs ICS (Lite); not a shared single workflow.',
  },
  {
    id: 'features-comparison',
    product: 'ICS + OPTIMUS',
    status: 'queued',
    scope: 'Features comparison — OPTIMUS (Enterprise) vs ICS (Lite).',
  },
  {
    id: 'ics-trucker-payment',
    product: 'ICS',
    status: 'queued',
    scope: 'Trucker — new payment flow for releasing CRO/eDO documents.',
  },
  {
    id: 'optimus-edo-release',
    product: 'OPTIMUS',
    status: 'queued',
    route: '/edo/release',
    scope: 'Release eDO confirmation — track consignees who have not returned empty containers.',
  },
  {
    id: 'optimus-cy-account',
    product: 'OPTIMUS',
    status: 'in_progress',
    scope: 'CY account module — container yard login, pre-forecast queue, and yard-scoped inventory.',
  },
];

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '0.7.0',
    date: '2026-08-10',
    title: 'Registration, verification & transactional email',
    summary:
      'End-to-end auth onboarding with branded HTML emails, phased registration UI, and role-specific welcome messages.',
    changes: [
      { type: 'added', text: 'Professional HTML verification emails with verify button and manual code fallback.' },
      { type: 'added', text: 'Role-specific welcome email after verification (Broker, Consignee, Trucker).' },
      { type: 'added', text: 'Resend HTTP API support for Railway Hobby (SMTP ports blocked on Hobby plan).' },
      { type: 'added', text: 'Background email queue so registration API responds quickly.' },
      { type: 'improved', text: 'Registration flow: form → loading → success (prevents double submit).' },
      { type: 'improved', text: 'Email verified page with cleaner success, loading, and error states.' },
      { type: 'improved', text: 'Verification email layout — removed crowded long URL block.' },
      { type: 'fixed', text: 'Duplicate verify-email requests and idempotent verification link clicks.' },
      { type: 'fixed', text: 'Resend verification email for already-registered but unverified accounts.' },
      { type: 'security', text: 'Removed SMTP password from committed railway env example file.' },
      { type: 'infra', text: 'Hostinger SMTP (MailKit) for local dev and SMTP-capable hosts.' },
    ],
  },
  {
    version: '0.6.0',
    date: '2026-08-09',
    title: 'Operations, inventory & platform admin',
    summary: 'Yard inventory improvements, system admin dashboard, and production data tooling.',
    changes: [
      { type: 'added', text: 'System Admin dashboard with platform metrics API.' },
      { type: 'added', text: 'Per-depot tabs on container inventory page.' },
      { type: 'added', text: 'Production transaction reset API for fresh demo/system state.' },
      { type: 'added', text: 'Re-seed demo data after transaction reset.' },
      { type: 'improved', text: 'CY terminal cards — three equal columns on dashboard.' },
      { type: 'improved', text: 'System Admin navigation aligned with Optimus V1.' },
      { type: 'fixed', text: 'Manifest workflow controls wrapping on mobile.' },
    ],
  },
  {
    version: '0.5.0',
    date: '2026-08-08',
    title: 'Production hardening & eDO enhancements',
    summary: 'Railway + Hostinger MySQL reliability, CORS fixes, and eDO payment tooling.',
    changes: [
      { type: 'added', text: 'eDO payment receipt OCR and payment receipt insights panel.' },
      { type: 'added', text: 'Accreditation certificate polish and platform admin UX updates.' },
      { type: 'added', text: 'Profile photo upload (backend + TopBar avatar).' },
      { type: 'fixed', text: 'Production CORS failures from PWA API cache and preflight limits.' },
      { type: 'fixed', text: 'CORS on API error responses and hardened production CORS config.' },
      { type: 'fixed', text: 'EF migration baseline for Hostinger shared MySQL.' },
      { type: 'fixed', text: 'Railway migrate failure when Hostinger DB lacks EF migration history.' },
      { type: 'infra', text: 'Prefer MYSQL_* env vars over localhost appsettings default.' },
      { type: 'infra', text: 'EF migrations on Railway pre-deploy; listen before migrate for healthcheck.' },
    ],
  },
  {
    version: '0.4.0',
    date: '2026-08-07',
    title: 'Mobile & theme',
    summary: 'Responsive layout pass and default light theme.',
    changes: [
      { type: 'improved', text: 'Mobile responsiveness across frontend pages.' },
      { type: 'improved', text: 'Default theme set to light instead of following OS dark preference.' },
    ],
  },
  {
    version: '0.3.0',
    date: '2026-08-06',
    title: 'Deploy pipeline',
    summary: 'Hostinger frontend deploy and Railway API hosting.',
    changes: [
      { type: 'added', text: 'Railway deployment with Docker, healthcheck, and Hostinger MySQL env vars.' },
      { type: 'added', text: 'Hostinger frontend deploy via orphan git branch + SSH pull.' },
      { type: 'added', text: 'Hostinger migrate script and deploy validation (SSH password, remote path).' },
      { type: 'fixed', text: 'Production frontend build errors.' },
      { type: 'fixed', text: 'Railway healthcheck — defer DB seed to background on startup.' },
      { type: 'infra', text: 'DB migrate on startup for shared hosting compatibility.' },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-08-06',
    title: 'Optimus V2 initial release',
    summary: '.NET 7 API + React PWA foundation for shipping operations.',
    changes: [
      { type: 'added', text: 'Core platform: manifests, eDO/CRO, yard ops, SAS accreditation, payments.' },
      { type: 'added', text: 'Role-based access: Broker, Consignee, Trucker, Shipping Line staff, System Admin.' },
      { type: 'added', text: 'Identity: login, refresh tokens, role invitations, email verification foundation.' },
      { type: 'added', text: 'React PWA frontend with MUI, Redux RTK Query, and workflow-oriented pages.' },
      { type: 'added', text: 'MySQL persistence with EF Core migrations (Phases 1–7).' },
    ],
  },
];

export const RELEASE_CHANGE_LABELS: Record<ReleaseChangeType, string> = {
  added: 'Added',
  improved: 'Improved',
  fixed: 'Fixed',
  infra: 'Infrastructure',
  security: 'Security',
};

export const RELEASE_CHANGE_COLORS: Record<
  ReleaseChangeType,
  'success' | 'info' | 'warning' | 'default' | 'error'
> = {
  added: 'success',
  improved: 'info',
  fixed: 'warning',
  infra: 'default',
  security: 'error',
};

export const ROADMAP_STATUS_LABELS: Record<RoadmapItemStatus, string> = {
  in_progress: 'In progress',
  queued: 'Queued',
};

export const ROADMAP_STATUS_COLORS: Record<RoadmapItemStatus, 'warning' | 'default'> = {
  in_progress: 'warning',
  queued: 'default',
};

export function countRoadmapItems(status: RoadmapItemStatus): number {
  return ROADMAP_ITEMS.filter((item) => item.status === status).length;
}

export function sumRoadmapHours(status?: RoadmapItemStatus): number | null {
  const items = status ? ROADMAP_ITEMS.filter((item) => item.status === status) : ROADMAP_ITEMS;
  if (items.some((item) => item.estimatedHours == null)) {
    return null;
  }
  return items.reduce((sum, item) => sum + (item.estimatedHours ?? 0), 0);
}

export function formatRoadmapHours(hours: number | null | undefined): string {
  if (hours == null) return 'TBD';
  return `${hours}h`;
}
