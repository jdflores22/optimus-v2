# Phase 6 — Notifications, Reports, Admin Polish, PWA

## Scope

Platform ops parity: multi-channel notifications, templates, audit/activity, eDO release metrics, scheduled reports, system settings, rate limits, maintenance jobs, and installable PWA.

## APIs

| Area | Routes |
|------|--------|
| Notifications | `/api/notifications` (+ preferences, push, metrics) |
| Message templates | `/api/message-templates` |
| System settings | `/api/system-settings` |
| Rate limits | `/api/rate-limits` |
| Document templates | `/api/document-templates` |
| Scheduled reports | `/api/scheduled-reports` |
| Reports | `/api/reports/edo-release` |
| Audit | `/api/audit/manifest/{id}`, `/api/audit/edo/{id}` |
| Activity | `/api/activity` |
| Maintenance | `/api/maintenance/run` |

## Frontend

- `/notifications` — center, preferences, demo push subscribe, metrics (admin)
- `/reports/audit` — eDO metrics + activity + audit lookup
- `/admin/platform` — settings, rate rules, templates, scheduled reports, maintenance

## PWA

`vite-plugin-pwa` with auto-update service worker, standalone manifest, icons in `public/`.

## Jobs

`PlatformHostedService` hourly: due scheduled reports + token/notification/file cleanup.

## Channels

- In-app + email (logging sender) + SMS/push logging stubs
- Delivery rows in `notification_deliveries` for metrics

## Smoke

1. Login admin → list notifications / upsert preferences / subscribe push  
2. GET metrics + eDO release report export  
3. Upsert system setting + rate rule + document template  
4. Process scheduled reports + run maintenance  
5. Confirm `/` returns `phase: 6`  
6. Frontend build includes service worker / manifest  

## Demo users

Same as prior phases — `admin@optimus.local` / `Admin123!`
