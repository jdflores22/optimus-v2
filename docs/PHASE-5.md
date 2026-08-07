# Phase 5 — SAS, Transfers, Appeals, Repositioning

## Scope

Satellite operational workflows: form builder + SAS accreditation, broker transfers (with suspension impact), suspension appeals, repositioning/export, referral codes, consignee onboarding.

## APIs

| Area | Routes |
|------|--------|
| Forms | `/api/forms` |
| SAS | `/api/accreditation` |
| Transfers | `/api/transfers` |
| Appeals | `/api/appeals` (+ suspend broker) |
| Repositioning | `/api/repositioning` |
| Referrals | `/api/referrals` |
| Onboarding | `/api/onboarding` |

## Frontend

`/sas`, `/transfers`, `/appeals`, `/repositioning`

## Seed

Active Broker + Consignee SAS forms; Consignee welcome content.

## Smoke

1. Broker submit SAS → Evaluator approve → SL Admin final approve  
2. Suspend broker → relationships Suspended → appeal approve  
3. Consignee transfer request → staff approve  
4. Create repositioning → approve → complete  
5. Consignee generate referral / broker apply  

## Demo users

`broker@`, `consignee@`, `evaluator@`, `sladmin@`, `slstaff@`, `admin@`, `terminal@` `@optimus.local` / `Admin123!`
