# Cutover runbook + rollback (T7.9)

## Pre-cutover

1. Freeze Symfony writes (maintenance banner) or start dual-read window.  
2. Backup MySQL (`optimus` old + `optimus_v2` new).  
3. Confirm V2 health: `GET /health`, `GET /` → `phase: 7`.  
4. Dry-run migration: see `tools/migration/README.md` + `validate-counts.sql`.  
5. Run `scripts/smoke-phase7.ps1` and role matrix spot-checks.  
6. Confirm Redis (optional) and SMTP/SMS/push providers for prod.

## Cutover

1. Final dump from old DB → run migration loaders.  
2. Re-run row-count validation; gate on zero critical deltas.  
3. Point DNS / reverse proxy to V2 API + React static host.  
4. Keep Symfony read-only for 24–48h if needed.  
5. Monitor Serilog, `/health`, rate-limit 429s, auth lockouts.

## Rollback

1. Repoint DNS/proxy to Symfony.  
2. Restore `optimus_v2` from pre-cutover backup if writes contaminated.  
3. Unfreeze Symfony writes.  
4. File incident notes: what failed (migration, auth, uploads, jobs).

## Owners

| Role | Responsibility |
|------|----------------|
| Backend | Migrations, API config, jobs |
| Frontend | Build/deploy PWA assets |
| Ops | DNS, TLS, MySQL/Redis backups |
| Client | UAT sign-off (`UAT-SIGNOFF.md`) |
