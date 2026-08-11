using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Optimus.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PreForecastSchemaFollowUp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                SET @fk_exists = (
                    SELECT COUNT(*)
                    FROM information_schema.table_constraints
                    WHERE table_schema = DATABASE()
                      AND table_name = 'geotag_photos'
                      AND constraint_name = 'FK_geotag_photos_pre_advice_requests_PreAdviceRequestId');
                SET @sql = IF(
                    @fk_exists > 0,
                    'ALTER TABLE `geotag_photos` DROP FOREIGN KEY `FK_geotag_photos_pre_advice_requests_PreAdviceRequestId`',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                """);

            migrationBuilder.Sql("""
                SET @exists = (
                    SELECT COUNT(*)
                    FROM information_schema.tables
                    WHERE table_schema = DATABASE()
                      AND table_name = 'pre_advice_requests');
                SET @sql = IF(
                    @exists > 0,
                    'RENAME TABLE `pre_advice_requests` TO `pre_forecast_requests`',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                """);

            migrationBuilder.Sql("""
                SET @col_exists = (
                    SELECT COUNT(*)
                    FROM information_schema.columns
                    WHERE table_schema = DATABASE()
                      AND table_name = 'geotag_photos'
                      AND column_name = 'PreAdviceRequestId');
                SET @sql = IF(
                    @col_exists > 0,
                    'ALTER TABLE `geotag_photos` CHANGE COLUMN `PreAdviceRequestId` `PreForecastRequestId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                """);

            migrationBuilder.Sql("""
                SET @idx_exists = (
                    SELECT COUNT(*)
                    FROM information_schema.statistics
                    WHERE table_schema = DATABASE()
                      AND table_name = 'geotag_photos'
                      AND index_name = 'IX_geotag_photos_PreAdviceRequestId');
                SET @sql = IF(
                    @idx_exists > 0,
                    'ALTER TABLE `geotag_photos` DROP INDEX `IX_geotag_photos_PreAdviceRequestId`',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                """);

            migrationBuilder.Sql("""
                SET @idx_exists = (
                    SELECT COUNT(*)
                    FROM information_schema.statistics
                    WHERE table_schema = DATABASE()
                      AND table_name = 'geotag_photos'
                      AND index_name = 'IX_geotag_photos_PreForecastRequestId');
                SET @sql = IF(
                    @idx_exists = 0,
                    'CREATE INDEX `IX_geotag_photos_PreForecastRequestId` ON `geotag_photos` (`PreForecastRequestId`)',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                """);

            migrationBuilder.Sql(
                "UPDATE `containers` SET `Status` = 'PreForecastApproved' WHERE `Status` = 'PaApproved';");

            migrationBuilder.Sql("""
                SET @col_exists = (
                    SELECT COUNT(*)
                    FROM information_schema.columns
                    WHERE table_schema = DATABASE()
                      AND table_name = 'trucker_pre_forecast_submissions'
                      AND column_name = 'EdoVerificationToken');
                SET @sql = IF(
                    @col_exists = 0,
                    'ALTER TABLE `trucker_pre_forecast_submissions` ADD `EdoVerificationToken` varchar(128) CHARACTER SET utf8mb4 NOT NULL DEFAULT ''''',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                """);

            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS `trucker_pre_forecast_photos` (
                    `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
                    `SubmissionId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
                    `Category` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
                    `FilePath` varchar(500) CHARACTER SET utf8mb4 NOT NULL,
                    `OriginalName` varchar(255) CHARACTER SET utf8mb4 NULL,
                    `Comment` varchar(1000) CHARACTER SET utf8mb4 NULL,
                    `CreatedAt` datetime(6) NOT NULL,
                    `UpdatedAt` datetime(6) NULL,
                    CONSTRAINT `PK_trucker_pre_forecast_photos` PRIMARY KEY (`Id`),
                    CONSTRAINT `FK_trucker_pre_forecast_photos_trucker_pre_forecast_submissions~`
                        FOREIGN KEY (`SubmissionId`) REFERENCES `trucker_pre_forecast_submissions` (`Id`) ON DELETE CASCADE
                ) CHARACTER SET=utf8mb4;
                """);

            migrationBuilder.Sql("""
                SET @idx_exists = (
                    SELECT COUNT(*)
                    FROM information_schema.statistics
                    WHERE table_schema = DATABASE()
                      AND table_name = 'trucker_pre_forecast_photos'
                      AND index_name = 'IX_trucker_pre_forecast_photos_SubmissionId_Category');
                SET @sql = IF(
                    @idx_exists = 0,
                    'CREATE INDEX `IX_trucker_pre_forecast_photos_SubmissionId_Category` ON `trucker_pre_forecast_photos` (`SubmissionId`, `Category`)',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                """);

            migrationBuilder.Sql("""
                SET @fk_exists = (
                    SELECT COUNT(*)
                    FROM information_schema.table_constraints
                    WHERE table_schema = DATABASE()
                      AND table_name = 'geotag_photos'
                      AND constraint_name = 'FK_geotag_photos_pre_forecast_requests_PreForecastRequestId');
                SET @sql = IF(
                    @fk_exists = 0,
                    'ALTER TABLE `geotag_photos` ADD CONSTRAINT `FK_geotag_photos_pre_forecast_requests_PreForecastRequestId` FOREIGN KEY (`PreForecastRequestId`) REFERENCES `pre_forecast_requests` (`Id`) ON DELETE CASCADE',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                SET @fk_exists = (
                    SELECT COUNT(*)
                    FROM information_schema.table_constraints
                    WHERE table_schema = DATABASE()
                      AND table_name = 'geotag_photos'
                      AND constraint_name = 'FK_geotag_photos_pre_forecast_requests_PreForecastRequestId');
                SET @sql = IF(
                    @fk_exists > 0,
                    'ALTER TABLE `geotag_photos` DROP FOREIGN KEY `FK_geotag_photos_pre_forecast_requests_PreForecastRequestId`',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                """);

            migrationBuilder.Sql("DROP TABLE IF EXISTS `trucker_pre_forecast_photos`;");

            migrationBuilder.Sql("""
                SET @col_exists = (
                    SELECT COUNT(*)
                    FROM information_schema.columns
                    WHERE table_schema = DATABASE()
                      AND table_name = 'trucker_pre_forecast_submissions'
                      AND column_name = 'EdoVerificationToken');
                SET @sql = IF(
                    @col_exists > 0,
                    'ALTER TABLE `trucker_pre_forecast_submissions` DROP COLUMN `EdoVerificationToken`',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                """);

            migrationBuilder.Sql(
                "UPDATE `containers` SET `Status` = 'PaApproved' WHERE `Status` = 'PreForecastApproved';");

            migrationBuilder.Sql("""
                SET @col_exists = (
                    SELECT COUNT(*)
                    FROM information_schema.columns
                    WHERE table_schema = DATABASE()
                      AND table_name = 'geotag_photos'
                      AND column_name = 'PreForecastRequestId');
                SET @sql = IF(
                    @col_exists > 0,
                    'ALTER TABLE `geotag_photos` CHANGE COLUMN `PreForecastRequestId` `PreAdviceRequestId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                """);

            migrationBuilder.Sql("""
                SET @idx_exists = (
                    SELECT COUNT(*)
                    FROM information_schema.statistics
                    WHERE table_schema = DATABASE()
                      AND table_name = 'geotag_photos'
                      AND index_name = 'IX_geotag_photos_PreForecastRequestId');
                SET @sql = IF(
                    @idx_exists > 0,
                    'ALTER TABLE `geotag_photos` DROP INDEX `IX_geotag_photos_PreForecastRequestId`',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                """);

            migrationBuilder.Sql("""
                SET @idx_exists = (
                    SELECT COUNT(*)
                    FROM information_schema.statistics
                    WHERE table_schema = DATABASE()
                      AND table_name = 'geotag_photos'
                      AND index_name = 'IX_geotag_photos_PreAdviceRequestId');
                SET @sql = IF(
                    @idx_exists = 0,
                    'CREATE INDEX `IX_geotag_photos_PreAdviceRequestId` ON `geotag_photos` (`PreAdviceRequestId`)',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                """);

            migrationBuilder.Sql("""
                SET @exists = (
                    SELECT COUNT(*)
                    FROM information_schema.tables
                    WHERE table_schema = DATABASE()
                      AND table_name = 'pre_forecast_requests');
                SET @sql = IF(
                    @exists > 0,
                    'RENAME TABLE `pre_forecast_requests` TO `pre_advice_requests`',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                """);

            migrationBuilder.Sql("""
                SET @fk_exists = (
                    SELECT COUNT(*)
                    FROM information_schema.table_constraints
                    WHERE table_schema = DATABASE()
                      AND table_name = 'geotag_photos'
                      AND constraint_name = 'FK_geotag_photos_pre_advice_requests_PreAdviceRequestId');
                SET @sql = IF(
                    @fk_exists = 0,
                    'ALTER TABLE `geotag_photos` ADD CONSTRAINT `FK_geotag_photos_pre_advice_requests_PreAdviceRequestId` FOREIGN KEY (`PreAdviceRequestId`) REFERENCES `pre_advice_requests` (`Id`) ON DELETE CASCADE',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                """);
        }
    }
}
