-- Wipe all operational/transactional data in production.
-- Preserves: users, shipping lines, terminals, regions, platform settings, forms, fee config.
--
-- Run via phpMyAdmin or:
--   .\scripts\reset-prod-transactions.ps1
--
-- Or via API (System Admin):
--   POST /api/maintenance/reset-transactions

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM geotag_photos;
DELETE FROM pre_advice_requests;
DELETE FROM dwell_time_events;
DELETE FROM container_allocation_audits;
DELETE FROM repositioning_request_items;
DELETE FROM repositioning_requests;
DELETE FROM edo_access_logs;
DELETE FROM edo_release_history;
DELETE FROM edo_payments;
DELETE FROM edo_renewal_requests;
DELETE FROM edo_versions;
DELETE FROM electronic_delivery_orders;
DELETE FROM edo_generation_sessions;
DELETE FROM document_verifications;
DELETE FROM workflow_state_histories;
DELETE FROM payments;
DELETE FROM billings;
DELETE FROM noas;
DELETE FROM manifests;
DELETE FROM bulk_import_jobs;
DELETE FROM activity_logs;
DELETE FROM containers;
DELETE FROM accreditation_submissions;
DELETE FROM broker_transfer_requests;
DELETE FROM suspension_appeals;
DELETE FROM in_app_notifications;
DELETE FROM notification_deliveries;
DELETE FROM refresh_tokens;
DELETE FROM pending_users;

UPDATE terminal_slots SET AssignedCount = 0;

SET FOREIGN_KEY_CHECKS = 1;

-- Post-reset counts (expect zeros for transactional tables)
SELECT 'manifests' AS entity, COUNT(*) AS cnt FROM manifests
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'electronic_delivery_orders', COUNT(*) FROM electronic_delivery_orders
UNION ALL SELECT 'edo_payments', COUNT(*) FROM edo_payments
UNION ALL SELECT 'containers', COUNT(*) FROM containers
UNION ALL SELECT 'accreditation_submissions', COUNT(*) FROM accreditation_submissions
UNION ALL SELECT 'activity_logs', COUNT(*) FROM activity_logs
UNION ALL SELECT 'users', COUNT(*) FROM users;
