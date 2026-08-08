-- One-time fix: Hostinger DB created from optimus-v2-schema.sql without __EFMigrationsHistory rows.
-- Run in phpMyAdmin on u910121167_61mLrRkFt_OV2 when Railway pre-deploy fails with "Table 'regions' already exists".
-- Safe to re-run (INSERT IGNORE).

CREATE TABLE IF NOT EXISTS `__EFMigrationsHistory` (
    `MigrationId` varchar(150) NOT NULL,
    `ProductVersion` varchar(32) NOT NULL,
    CONSTRAINT `PK___EFMigrationsHistory` PRIMARY KEY (`MigrationId`)
);

INSERT IGNORE INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`) VALUES
('20260806030911_Phase1Identity', '7.0.20'),
('20260806032103_Phase2CargoChain', '7.0.20'),
('20260806033654_Phase3EdoCro', '7.0.20'),
('20260806035052_Phase4YardOps', '7.0.20'),
('20260806040637_Phase5OpsSatellite', '7.0.20'),
('20260806041746_Phase6Platform', '7.0.20'),
('20260806043025_Phase7Hardening', '7.0.20');

SELECT MigrationId FROM `__EFMigrationsHistory` ORDER BY MigrationId;
