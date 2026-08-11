# OPTIMUS V2 — System Bug & Gap Audit

**Date:** 12 August 2026  
**Scope:** Full stack — backend API/security, frontend routes/UX, pre-forecast renewal workflow, docs/regression coverage  
**Context:** Post sprint (trucker pre-forecast renewal + CY module). Happy path works; this document lists what still needs fixing before production sign-off.

---

## Executive summary

| Severity | Count | Theme |
|----------|------:|-------|
| **Critical** | 8 | IDOR / data leaks, unprotected uploads, broken broker pay UX, role matrix conflicts |
| **High** | 16 | Dual pre-forecast models, payment validation gaps, route guards, stale cache, dashboard wrong APIs |
| **Medium** | 14 | Placeholder PDFs, legacy dead code, nav/route drift, workflow copy mismatches |
| **Low** | 10 | UX polish, dead routes, naming, test coverage gaps |

**Recommended fix order:** Security (uploads + list IDOR) → Payment roles & broker UX → Route access alignment → Legacy pre-forecast cleanup → Dashboard/RTK cache → Production PDFs/UAT sign-off.

---

## Fix status (12 Aug 2026 evening)

**Sprint A–C items from this audit — implemented.** Restart `Optimus.Api` to load backend DLL changes (build succeeds; API copy fails while process is running).

| ID | Status |
|----|--------|
| C1–C8 | Fixed |
| H2–H4, H6–H9, H11–H17 | Fixed |
| L10 | Fixed (email verify token cleared) |
| H5, H8, H10, H18 | Fixed / addressed (legacy list trucker-only; renewals duplicate guard; smoke extended; legacy writes 410) |
| L3, M2 | Fixed (public verify PII reduced + token validation; DB rate rules wired to limiter) |
| M1–M14, L1–L9 | Open (Phase 7 / UX polish — not in security sprint) |

**Frontend:** Broker pay → `/edo/:id/payment`; Accounting eDO validation + nav; routeAccess aligned with App; TerminalTeam dashboard uses trucker intake; CyStaff filtered by assigned terminals; legacy `PreForecastPage` / `PreForecastTerminalQueue` removed.

**Backend:** Upload allowlist; role-scoped eDO/manifest lists; renewal ownership + duplicate guards; legacy pre-forecast cancel restricted; receipt required on eDO/renewal payments; 403 for authenticated forbidden.

**Single-shipping-line scoping (12 Aug late):** All operational lists and resource reads now resolve via `SoleShippingLine` — intake, renewals, legacy pre-forecast, containers, trucker search, manifest/eDO/pre-forecast access checks. No cross-line reads even if a second line exists in DB.

---

## CRITICAL

### Security & authorization (backend)

| ID | Issue | Location | Fix |
|----|-------|----------|-----|
| C1 | **Sensitive uploads publicly served.** Only `/uploads/edo/` and `/uploads/edo-qr/` blocked. Receipts, pre-forecast photos, billing PDFs, geotag images still reachable at `/uploads/**` if path is known (paths returned in DTOs). | `BlockEdoStaticFilesMiddleware.cs`, `Program.cs` | Block all sensitive prefixes or serve files only through authorized API endpoints. |
| C2 | **IDOR: `GET /api/edo` lists all eDOs** for Trucker, CyStaff, Accounting, etc. Only Broker/Consignee get auto-filtered. | `EdoControllers.cs`, `EdoServices.ListAsync` | Role-scope list: trucker → renewals only; staff → shipping line; default deny. |
| C3 | **IDOR: `GET /api/manifests` lists all manifests** for non-broker/consignee roles. | `CargoControllers.cs`, `CargoServices.ListAsync` | Apply same ownership rules as `EnsureManifestAccessAsync`. |
| C4 | **Renewal create without eDO ownership.** Broker/Consignee can POST renewal for any `ExpiredEdoId`. | `EdoRenewalService.RequestAsync` | Verify manifest broker/consignee matches actor (like payment submit). |
| C5 | **Legacy pre-forecast cancel unauthorized.** Any authenticated role (except trucker-not-owner) can cancel any legacy `PreForecastRequest`. | `PreForecastService.CancelAsync`, `YardControllers` | Restrict to TerminalTeam or owner trucker; use resource auth. |

### Frontend / product breaks

| ID | Issue | Location | Fix |
|----|-------|----------|-----|
| C6 | **Broker dashboard eDO pay has no receipt.** `onPay()` submits amount only — backend/UI expect receipt file. | `BrokerDashboardPage.tsx` | Redirect to `/edo/:id/payment` or require receipt upload. |
| C7 | **Broker “eDO Payments” CTA wrong route.** Links to `/payments` (detention billings), not eDO pay-to-open. | `BrokerDashboardPage.tsx` | Link to `/edo` or pending eDO payment list. |
| C8 | **Role matrix vs implementation: eDO payment validate.** Matrix: **Accounting**. App: **SystemAdmin only** (`EdoPaymentReviewPage`, `routeAccess`, nav). UI copy says “accounting validates” everywhere. | `EdoPaymentReviewPage.tsx`, `routeAccess.ts`, `edoPayToOpen.ts` | Product decision: give Accounting validate access **or** update matrix + all copy to “platform provider (SystemAdmin)”. |

---

## HIGH

### Backend

| ID | Issue | Location |
|----|-------|----------|
| H1 | Two pre-forecast models (`PreForecastRequest` legacy vs `TruckerPreForecastSubmission` intake); `ResourceAuthorizationService` only covers legacy. | `ResourceAuthorizationService.cs`, `YardOpsServices.cs` |
| H2 | Accounting can verify renewal detention payment **without receipt** on `verify-payment` endpoint. | `EdoRenewalService`, `EdoControllers` |
| H3 | eDO pay-to-open: client `amount` ignored; service uses fee table only — receipt/amount mismatch possible. | `EdoPaymentService.SubmitAsync` |
| H4 | eDO payment receipt **optional** on submit (`IFormFile? receipt`). | `EdoControllers.SubmitPayment` |
| H5 | Legacy `GET /api/v1/pre-forecast` list leaks all records to non-trucker roles. | `PreForecastService.ListAsync` |
| H6 | Pre-forecast intake accepts **non-expired** eDO (`Released`, `Active`) — not only expired/locked. | `YardOpsServices.SubmitAsync` ~716 |
| H7 | **No duplicate-intake guard** — same trucker/eDO can open multiple active submissions. | `YardOpsServices.SubmitAsync` |
| H8 | **No duplicate renewal guard** for same expired eDO. | `EdoRenewalService.RequestAsync` |
| H9 | `UnauthorizedAccessException` always → HTTP **401** (should be **403** when authenticated but forbidden). | `ExceptionHandlingMiddleware.cs` |
| H10 | Smoke tests (`smoke-phase7.ps1`) miss eDO list IDOR, upload static access, intake negative cases. | `scripts/smoke-phase7.ps1` |

### Frontend

| ID | Issue | Location |
|----|-------|----------|
| H11 | TerminalTeam dashboard uses **legacy** `getPreForecasts` — counts don’t match trucker intake queue. | `DashboardPage.tsx` |
| H12 | CyStaff queue/badge **not filtered by assigned terminal** on frontend (relies on backend; confirm + add client filter). | `CyStaffDashboardSection.tsx`, `preForecastIntakeFilters.ts` |
| H13 | **SystemAdmin blocked** from `/pre-forecast`, review, `/container-inventory` in `routeAccess` but allowed in `App.tsx`. | `routeAccess.ts` vs `App.tsx` |
| H14 | **Accounting** has renewals route access but **no nav** entry. | `navConfig.ts`, `routeAccess.ts` |
| H15 | **Consignee** can pay detention renewals but no renewals nav link. | `EdoRenewalsPage.tsx`, `navConfig.ts` |
| H16 | `validateEdoPayment` doesn’t invalidate **`TruckerIntake`** — trucker badges stay stale. | `api.ts` |

### Dead / duplicate code

| ID | Issue | Location |
|----|-------|----------|
| H17 | **Legacy pre-forecast UI** (`PreForecastPage.tsx`, `PreForecastTerminalQueue.tsx`) not routed in `App.tsx` — parallel dead flow. | `frontend/optimus-web/src/features/yard/` |
| H18 | Trucker token generate/revoke API **exported but no UI**. | `api.ts` (matrix expects token generate) |

---

## MEDIUM

| ID | Issue | Notes |
|----|-------|-------|
| M1 | **Placeholder PDFs** for NOA, BL, billing, OR, detention, utilization export | `PHASE-7.md` open item |
| M2 | **Rate limit admin rules** stored in DB but global limiter ignores them | Misleading admin UI |
| M3 | Generic **`GET /api/containers/{id}`** not CY/shipping-line scoped | Inventory routes scoped; generic routes not |
| M4 | Staff notifications **`Take(10)`** — may miss alerts in larger orgs | `YardOpsServices` |
| M5 | **Dual gate:** `App.tsx` `<Protected roles>` vs `RouteAccessGuard` lists often differ | Maintenance hazard |
| M6 | `AwaitingRenewalPayment` status message says broker/consignee pay; **trucker** pays for pre-forecast renewal | `YardOpsServices.StatusMessage` |
| M7 | Manual renewal stores detention PDF path in **`AdditionalNotes`** text vs proper `Billing` row | `EdoRenewalService` |
| M8 | SlStaff **`PendingReview` without renewalRequestId** — warning only, no recovery | `PreForecastSlStaffRenewalPanel.tsx` |
| M9 | Accounting dashboard ignores **pre-forecast billing queue** despite nav badge | `DashboardPage.tsx` |
| M10 | ShippingLinesAdmin custom nav **omits** pre-forecast / renewals (dashboard links exist) | `navConfig.ts` |
| M11 | Broker renewal pay **raw file input** vs dedicated detention payment page UX | `EdoRenewalsPage.tsx` |
| M12 | `/pre-forecast/yard` route rule **dead** (redirects to `/pre-forecast`) | `routeAccess.ts`, `App.tsx` |
| M13 | SystemAdmin blocked from **`/repositioning`** in routeAccess but allowed in App | `routeAccess.ts` |
| M14 | Legacy + intake APIs both live; dashboard partially on legacy | `api.ts`, `DashboardPage.tsx` |

---

## LOW

| ID | Issue |
|----|-------|
| L1 | Staff read bypass in `ResourceAuthorizationService` — no shipping-line scope on all staff reads |
| L2 | Trucker search exposes broker/consignee metadata system-wide |
| L3 | Public document verify endpoint — rate-limit / minimize PII if needed |
| L4 | Policy name `YardAdmin` vs `EnsureTerminalStaff` roles mismatch |
| L5 | UAT sign-off template still open (`UAT-SIGNOFF.md`) |
| L6 | Trucker quick actions include **profile** but no profile nav item |
| L7 | `PreForecastIntakeQueue` unused `onMessage` prop |
| L8 | Legacy redirect `/edo/release/payments/:id` |
| L9 | ShippingLinesAdmin accreditations: `/sas` vs `/approvals` two entry points |
| L10 | Email verification token not cleared after verify | `AuthService.cs` |

---

## What works well (no action needed for happy path)

- Trucker intake submit → terminal assign → CY confirm → accounting → SL renewal → trucker pay → auto-release (**tested this sprint**)
- `EnsureSubmissionAccessAsync` on intake GET/detail
- `EnsureEdoAccessAsync` on eDO get/download/payment submit
- `EnsureManifestAccessAsync` on manifest get/payment
- CyStaff inventory scoped via `CyScopeService`
- PDF signatory fix + RENEWED branding (after API restart)
- SL Staff / CY dashboard intake metrics (after this sprint)
- Refresh token family revoke, upload extension guard, eDO static block for PDF/QR

---

## Product / docs conflicts to resolve once

| Topic | Doc says | Code says | Decision needed |
|-------|----------|-----------|----------------|
| eDO pay-to-open validator | Accounting (`ROLE-REGRESSION-MATRIX`) | **Accounting + SystemAdmin** (aligned 12 Aug) | Done — matrix matches code |
| Pre-forecast flow | UAT “geotag + pre-advice” (`UAT-WORKFLOWS`) | Trucker QR intake is live path | Update UAT; deprecate legacy |
| TerminalTeam pre-forecast | “verify/complete” legacy | Intake “assign terminal” | Update matrix + training docs |
| Production PDFs | Real templates expected | Placeholders | Phase 7 exit criteria |

---

## Suggested sprint backlog (prioritized)

### Sprint A — Security (must before prod)

1. C1 — Block sensitive static uploads  
2. C2, C3 — Scope list endpoints  
3. C4, C5 — Renewal ownership + legacy cancel auth  
4. H9 — 401 vs 403  
5. Extend `smoke-phase7.ps1` for C2–C5  

### Sprint B — Payments & roles

1. C8 — Accounting vs SystemAdmin eDO validation (product call)  
2. C6, C7 — Broker dashboard payment fix  
3. H2, H3, H4 — Receipt required; amount validation  
4. H16 — RTK `TruckerIntake` invalidation on validate  

### Sprint C — Pre-forecast hygiene

1. H6, H7 — Expired-only + duplicate intake guard  
2. H17, M14 — Remove or gate legacy pre-forecast UI/API  
3. H11, H12 — Dashboard + CyStaff terminal scoping  
4. M6 — Status message copy for trucker pay  

### Sprint D — UX & ops polish

1. H13 — Align `routeAccess` with `App.tsx` (or document SystemAdmin as platform-only)  
2. H14, H15 — Nav gaps for Accounting/Consignee renewals  
3. M1 — Real PDF templates  
4. UAT sign-off + cutover runbook execution  

---

## Regression commands

```powershell
# From repo root
powershell -File scripts/smoke-phase7.ps1

# Frontend typecheck
cd frontend/optimus-web
npx tsc --noEmit

# Backend build (stop Optimus.Api first if DLL locked)
dotnet build src/Optimus.Api/Optimus.Api.csproj
```

---

## Related docs

- [ACTIVITY-REPORT-2026-08-11.md](./ACTIVITY-REPORT-2026-08-11.md) — What shipped this sprint  
- [ROLE-REGRESSION-MATRIX.md](./ROLE-REGRESSION-MATRIX.md) — Role expectations (some drift vs code)  
- [PHASE-7.md](./PHASE-7.md) — Hardening checklist (placeholders still open)  
- [UAT-WORKFLOWS.md](./UAT-WORKFLOWS.md) — Needs update for intake flow  
