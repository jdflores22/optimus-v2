using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Optimus.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CyStaffAccountModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "DROP INDEX IF EXISTS `IX_pre_advice_requests_TruckerId_Status` ON `pre_advice_requests`;");

            migrationBuilder.AlterColumn<string>(
                name: "ProfilePhotoPath",
                table: "users",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(500)",
                oldMaxLength: 500,
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.Sql(@"
                SET @exist := (
                    SELECT COUNT(*) FROM information_schema.statistics
                    WHERE table_schema = DATABASE()
                      AND table_name = 'pre_advice_requests'
                      AND index_name = 'IX_pre_advice_requests_TruckerId');
                SET @sqlstmt := IF(
                    @exist = 0,
                    'CREATE INDEX `IX_pre_advice_requests_TruckerId` ON `pre_advice_requests` (`TruckerId`)',
                    'SELECT 1');
                PREPARE stmt FROM @sqlstmt;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_pre_advice_requests_TruckerId",
                table: "pre_advice_requests");

            migrationBuilder.AlterColumn<string>(
                name: "ProfilePhotoPath",
                table: "users",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_pre_advice_requests_TruckerId_Status",
                table: "pre_advice_requests",
                columns: new[] { "TruckerId", "Status" });
        }
    }
}
