# Role regression matrix (T7.1)

Demo password for all seeded users: `Admin123!`

| Role | Email | Must pass |
|------|-------|-----------|
| SystemAdmin | admin@optimus.local | Login, hierarchy, platform settings, maintenance, shipping lines |
| ShippingLinesAdmin | sladmin@optimus.local | Shipping line switch, forms publish, eDO release, reports |
| SlStaff | slstaff@optimus.local | Manifest create → NOA → BL; declare consignee |
| Evaluator | evaluator@optimus.local | SAS evaluator action |
| Accounting | accounting@optimus.local | Billing generate; payment validate; eDO payment validate |
| TerminalTeam | terminal@optimus.local | eDO release queue; pre-forecast verify/complete |
| Broker | broker@optimus.local | Own manifests only; payment submit; SAS; appeal |
| Consignee | consignee@optimus.local | Own manifests; transfer; referral |
| Trucker | trucker@optimus.local | Pre-forecast submit; token generate; cannot see other PF |

## Negative checks

| Actor | Action | Expected |
|-------|--------|----------|
| Broker A | `GET /api/manifests/{other}` | 401/403 |
| Broker | `GET /api/edo/{unrelated}` | 401/403 |
| Trucker | `GET /api/v1/pre-forecast/{other}` | 401/403 |
| Any | Upload `.exe` receipt | 400 |
| Reused refresh token | `POST /api/auth/refresh` | 401 + family revoked |

Run: `powershell -File optimus-v2/scripts/smoke-phase7.ps1`
