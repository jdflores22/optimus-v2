using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Optimus.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DetentionBillingNullableManifest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_billings_manifests_ManifestId",
                table: "billings");

            migrationBuilder.DropIndex(
                name: "IX_billings_ManifestId",
                table: "billings");

            migrationBuilder.AlterColumn<Guid>(
                name: "ManifestId",
                table: "billings",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci",
                oldClrType: typeof(Guid),
                oldType: "char(36)",
                oldCollation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_billings_ManifestId",
                table: "billings",
                column: "ManifestId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_billings_manifests_ManifestId",
                table: "billings",
                column: "ManifestId",
                principalTable: "manifests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_billings_manifests_ManifestId",
                table: "billings");

            migrationBuilder.DropIndex(
                name: "IX_billings_ManifestId",
                table: "billings");

            migrationBuilder.AlterColumn<Guid>(
                name: "ManifestId",
                table: "billings",
                type: "char(36)",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                collation: "ascii_general_ci",
                oldClrType: typeof(Guid),
                oldType: "char(36)",
                oldNullable: true,
                oldCollation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_billings_ManifestId",
                table: "billings",
                column: "ManifestId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_billings_manifests_ManifestId",
                table: "billings",
                column: "ManifestId",
                principalTable: "manifests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
