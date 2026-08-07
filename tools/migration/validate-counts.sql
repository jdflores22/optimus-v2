-- T7.8 row-count validation stub
-- Run against optimus_v2 after migration; compare to legacy counts manually.

SELECT 'users' AS entity, COUNT(*) AS cnt FROM users
UNION ALL SELECT 'shipping_lines', COUNT(*) FROM shipping_lines
UNION ALL SELECT 'manifests', COUNT(*) FROM manifests
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'electronic_delivery_orders', COUNT(*) FROM electronic_delivery_orders
UNION ALL SELECT 'pre_advice_requests', COUNT(*) FROM pre_advice_requests
UNION ALL SELECT 'accreditation_submissions', COUNT(*) FROM accreditation_submissions
UNION ALL SELECT 'broker_transfer_requests', COUNT(*) FROM broker_transfer_requests
UNION ALL SELECT 'suspension_appeals', COUNT(*) FROM suspension_appeals
UNION ALL SELECT 'repositioning_requests', COUNT(*) FROM repositioning_requests
UNION ALL SELECT 'in_app_notifications', COUNT(*) FROM in_app_notifications;

-- Critical zero-diff gates (fill expected from legacy):
-- EXPECT users >= N
-- EXPECT manifests = N
-- EXPECT electronic_delivery_orders = N
