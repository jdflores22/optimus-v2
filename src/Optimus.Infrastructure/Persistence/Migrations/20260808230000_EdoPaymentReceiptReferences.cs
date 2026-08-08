using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Optimus.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EdoPaymentReceiptReferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                SET @col_exists = (
                    SELECT COUNT(*)
                    FROM information_schema.columns
                    WHERE table_schema = DATABASE()
                      AND table_name = 'edo_payments'
                      AND column_name = 'PaymentChannel');
                SET @sql = IF(
                    @col_exists = 0,
                    'ALTER TABLE `edo_payments` ADD `PaymentChannel` varchar(50) CHARACTER SET utf8mb4 NULL',
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
                      AND table_name = 'edo_payments'
                      AND column_name = 'PaymentReference');
                SET @sql = IF(
                    @col_exists = 0,
                    'ALTER TABLE `edo_payments` ADD `PaymentReference` varchar(100) CHARACTER SET utf8mb4 NULL',
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
                      AND table_name = 'edo_payments'
                      AND column_name = 'QrphNumber');
                SET @sql = IF(
                    @col_exists = 0,
                    'ALTER TABLE `edo_payments` ADD `QrphNumber` varchar(100) CHARACTER SET utf8mb4 NULL',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "QrphNumber", table: "edo_payments");
            migrationBuilder.DropColumn(name: "PaymentReference", table: "edo_payments");
            migrationBuilder.DropColumn(name: "PaymentChannel", table: "edo_payments");
        }
    }
}
