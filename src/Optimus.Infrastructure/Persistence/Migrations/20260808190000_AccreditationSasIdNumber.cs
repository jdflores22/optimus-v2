using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Optimus.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AccreditationSasIdNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                SET @col_exists = (
                    SELECT COUNT(*)
                    FROM information_schema.columns
                    WHERE table_schema = DATABASE()
                      AND table_name = 'accreditation_submissions'
                      AND column_name = 'SasIdNumber');
                SET @sql = IF(
                    @col_exists = 0,
                    'ALTER TABLE `accreditation_submissions` ADD `SasIdNumber` varchar(30) CHARACTER SET utf8mb4 NULL',
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
                      AND table_name = 'accreditation_submissions'
                      AND index_name = 'IX_accreditation_submissions_SasIdNumber');
                SET @sql = IF(
                    @idx_exists = 0,
                    'CREATE UNIQUE INDEX `IX_accreditation_submissions_SasIdNumber` ON `accreditation_submissions` (`SasIdNumber`)',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_accreditation_submissions_SasIdNumber",
                table: "accreditation_submissions");

            migrationBuilder.DropColumn(
                name: "SasIdNumber",
                table: "accreditation_submissions");
        }
    }
}
