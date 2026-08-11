# Optimus V2 Phase 1 Notes

Phase 1 (Identity, Roles, Hierarchy, Shipping Lines) is complete.

## Verified
- All 9 roles can log in
- Hierarchy lists 9 users
- Broker has linked consignee workspace
- Demo shipping line seeded with permission matrix
- Frontend build succeeds

## Seeded accounts (password: `Admin123!`)
- admin@optimus.local — SystemAdmin
- sladmin@optimus.local — ShippingLinesAdmin
- slstaff@optimus.local — SlStaff
- evaluator@optimus.local — Evaluator
- accounting@optimus.local — Accounting
- terminal@optimus.local — TerminalTeam
- broker@optimus.local — Broker
- consignee@optimus.local — Consignee
- trucker@optimus.local — Trucker
- cy@optimus.local — CyStaff (Container Yard, assigned to CY-MNL)

## Referral code
- `DEMOREF01` (for broker registration linkage)

## Notes
- Emails (verify / OTP / invites) are logged via Serilog (`LoggingEmailSender`) in Phase 1
- JWT includes `shipping_line_id` and `workspace_consignee_id` claims when set
