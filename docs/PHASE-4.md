# Phase 4 — Terminals, Containers, Dwell, Pre-Advice

## Scope

Yard operations: terminals/slots, container inventory + CY allocate, dwell monitoring, trucker pre-advice → terminal verify/print.

## Backend

| Area | Routes |
|------|--------|
| Terminals/slots | `/api/terminals` |
| Types/sizes | `/api/container-catalog` |
| CY allocations | `/api/cy-allocations` |
| Containers | `/api/containers` (+ allocate/reallocate/stack/utilization) |
| Dwell | `/api/dwell` |
| Pre-advice | `/api/v1/pre-advice` |
| Trucker tokens | `/api/v1/token` |
| Notifications | `/api/notifications` |

### Jobs
- `DwellMonitoringHostedService` every 5 minutes (notify threshold → Alert, auto-return threshold → Returned)
- Manual trigger: `POST /api/dwell/process`

### Seed
- Terminal `CY-MNL`, types DRY/REEFER, sizes 20FT/40FT, dwell config 60/90, demo CY allocation for Demo Shipping Line

## Frontend

| Route | Purpose |
|-------|---------|
| `/yard` | Terminals + inventory create/allocate |
| `/dwell` | Config, monitor, pause/resume, run job |
| `/pre-advice` | Trucker submit + terminal queue/print |
| `/reports/utilization` | CY utilization + CSV/PDF export |

## Smoke checklist

1. Create container → allocate CY → available for return  
2. Trucker submit pre-advice with geotag photo  
3. Terminal approve → complete/print package  
4. Record arrival → pause/resume → process job (lower thresholds for quick test)  
5. Trucker generate/revoke API token  
6. Utilization export  

## Demo users

`slstaff@`, `terminal@`, `trucker@`, `sladmin@`, `admin@` `@optimus.local` / `Admin123!`
