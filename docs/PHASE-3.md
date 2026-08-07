# Phase 3 — eDO/CRO Lifecycle

## Scope

Electronic Delivery Order / Container Release Order as **one** document module (`ElectronicDeliveryOrder`).

Flow: **Generate → Pay → Release → Renew → Expire/Unlock** + public QR verify.

## Backend

| Area | Details |
|------|---------|
| Entities | `ElectronicDeliveryOrder`, `EdoVersion`, `EdoPayment`, `EdoRenewalRequest`, `EdoReleaseHistory`, `EdoAccessLog`, `GenerationSession`, `DocumentVerification` |
| APIs | `/api/edo`, `/api/edo-payments`, `/api/edo-renewals`, `/api/verify/document/{token}` |
| QR | QRCoder PNG under `wwwroot/uploads/edo-qr` |
| PDF | Placeholder PDFs (same pattern as Phase 2) |
| Expiration | `EdoExpirationHostedService` every 5 minutes |
| Fee | `PaymentFeeConfiguration` feeType `edo` (seeded 750 PHP) |

### Statuses

`PendingValidation` → (payment verified) → `PendingRelease` → `Released` → (`Expired`/`Locked`) → unlock → `Active`  
Renewal can supersede and generate a new document.

### Workflow states (manifest)

`PaymentVerified` → `EdoGenerated` → `EdoReleased`

## Frontend

| Route | Role focus |
|-------|------------|
| `/edo` | Generate (SL), pay/renew (broker), unlock (admin), package (terminal) |
| `/edo/release` | Accounting payment queue + admin/terminal release |
| `/edo/renewals` | Review / verify detention / generate renewed |
| `/verify/:token` | Public (anonymous) |

## Smoke checklist

1. Manifest at `PaymentVerified`
2. SL Staff generates eDO (or batch)
3. Broker submits eDO payment
4. Accounting validates payment
5. Admin/Terminal releases eDO
6. Broker requests renewal (detention if overdue)
7. Staff/Accounting complete renewal → new eDO
8. Force expire (set `ExpiresAt` past) → job/unlock
9. Open `/verify/{token}` — valid document

## Demo users

Same Phase 1 seeds (`Admin123!`): `slstaff@`, `broker@`, `accounting@`, `terminal@`, `admin@` `@optimus.local`
