# Optimus V2 Phase 2 Notes

Phase 2 cargo money chain is complete and smoke-tested.

## Verified E2E path
`ManifestUploaded → NoaGenerated → BlGenerated → BlUploaded → BillingGenerated → PaymentSubmitted → PaymentVerified`

## APIs
- `/api/manifests` — create, list, declare consignee, NOA, BL generate/upload, billing, bulk import
- `/api/payments` — submit, pending queue, validate/reject
- `/api/payment-fees` — active fee + admin upsert (+ QR upload)
- `/api/exchange-rate/usd-php` — Frankfurter + cache fallback
- `/api/activity-logs` — recent activity

## Frontend routes
- `/manifests` — role actions for SL Staff / Broker / Accounting
- `/manifests/:id` — detail, history, document links
- `/payments` — submit + validation queue + fee config

## Notes
- Documents are placeholder text files under `wwwroot/uploads` (PDF engine comes in later phases)
- Notifications for NOA are activity-log based in Phase 2 (email templates in Phase 6)
