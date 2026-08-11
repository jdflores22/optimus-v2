# Phase 7 — Hardening & Parity Sign-off

## Scope

Production-readiness pass: security hardening, performance indexes, regression/UAT artifacts, migration stub, cutover runbook.

## Security (T7.5)

| Control | Status |
|---------|--------|
| JWT refresh rotation | Existing |
| Refresh reuse → revoke token family | Added |
| Account lockout (5 fails / 15 min) | Existing |
| Global rate limiter (180/min) | Wired to DB `RateLimitRule` cache (path-prefix + role); admin upsert invalidates cache |
| Upload validation (size/ext) | `UploadGuard` on all upload endpoints |
| IDOR ownership | `IResourceAuthorizationService` on manifest/eDO/pre-advice get + payment submit |

## Performance (T7.6)

- Status / ownership indexes on manifests, payments, eDOs, pre-advice, rate_limit_rules
- eDO release metrics use SQL aggregates (no full-table materialize)

## Artifacts

| Doc / script | Purpose |
|--------------|---------|
| [`ROLE-REGRESSION-MATRIX.md`](./ROLE-REGRESSION-MATRIX.md) | T7.1 |
| [`UAT-WORKFLOWS.md`](./UAT-WORKFLOWS.md) | T7.2 |
| [`PDF-VISUAL-QA.md`](./PDF-VISUAL-QA.md) | T7.4 |
| [`CUTOVER-RUNBOOK.md`](./CUTOVER-RUNBOOK.md) | T7.9 |
| [`UAT-SIGNOFF.md`](./UAT-SIGNOFF.md) | T7.10 |
| [`../tools/migration/`](../tools/migration/) | T7.7–T7.8 |
| [`../scripts/smoke-phase7.ps1`](../scripts/smoke-phase7.ps1) | Automated smoke |

## Exit notes

- Section 12 checklist in plan marked for implemented V2 surface (placeholder PDFs / S3 still open).
- Client sign-off (`UAT-SIGNOFF.md`) requires human signature — template only.
