using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Optimus.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PreForecastWorkflowColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AssignedSlotId",
                table: "trucker_pre_forecast_submissions",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "AssignedTerminalId",
                table: "trucker_pre_forecast_submissions",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<DateTime>(
                name: "CyConfirmedAt",
                table: "trucker_pre_forecast_submissions",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CyConfirmedById",
                table: "trucker_pre_forecast_submissions",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<DateTime>(
                name: "CyConfirmedReturnDate",
                table: "trucker_pre_forecast_submissions",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CyNotes",
                table: "trucker_pre_forecast_submissions",
                type: "varchar(2000)",
                maxLength: 2000,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<Guid>(
                name: "NewEdoId",
                table: "trucker_pre_forecast_submissions",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "PreferredTerminalId",
                table: "trucker_pre_forecast_submissions",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<string>(
                name: "TerminalNotes",
                table: "trucker_pre_forecast_submissions",
                type: "varchar(2000)",
                maxLength: 2000,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "PaymentReceiptPath",
                table: "edo_renewal_requests",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "PaymentReference",
                table: "edo_renewal_requests",
                type: "varchar(120)",
                maxLength: 120,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_trucker_pre_forecast_submissions_AssignedSlotId",
                table: "trucker_pre_forecast_submissions",
                column: "AssignedSlotId");

            migrationBuilder.CreateIndex(
                name: "IX_trucker_pre_forecast_submissions_AssignedTerminalId",
                table: "trucker_pre_forecast_submissions",
                column: "AssignedTerminalId");

            migrationBuilder.CreateIndex(
                name: "IX_trucker_pre_forecast_submissions_CyConfirmedById",
                table: "trucker_pre_forecast_submissions",
                column: "CyConfirmedById");

            migrationBuilder.CreateIndex(
                name: "IX_trucker_pre_forecast_submissions_NewEdoId",
                table: "trucker_pre_forecast_submissions",
                column: "NewEdoId");

            migrationBuilder.CreateIndex(
                name: "IX_trucker_pre_forecast_submissions_PreferredTerminalId",
                table: "trucker_pre_forecast_submissions",
                column: "PreferredTerminalId");

            migrationBuilder.CreateIndex(
                name: "IX_trucker_pre_forecast_submissions_Status",
                table: "trucker_pre_forecast_submissions",
                column: "Status");

            migrationBuilder.AddForeignKey(
                name: "FK_trucker_pre_forecast_submissions_electronic_delivery_orders~1",
                table: "trucker_pre_forecast_submissions",
                column: "NewEdoId",
                principalTable: "electronic_delivery_orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_trucker_pre_forecast_submissions_terminal_slots_AssignedSlot~",
                table: "trucker_pre_forecast_submissions",
                column: "AssignedSlotId",
                principalTable: "terminal_slots",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_trucker_pre_forecast_submissions_terminals_AssignedTerminalId",
                table: "trucker_pre_forecast_submissions",
                column: "AssignedTerminalId",
                principalTable: "terminals",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_trucker_pre_forecast_submissions_terminals_PreferredTerminal~",
                table: "trucker_pre_forecast_submissions",
                column: "PreferredTerminalId",
                principalTable: "terminals",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_trucker_pre_forecast_submissions_users_CyConfirmedById",
                table: "trucker_pre_forecast_submissions",
                column: "CyConfirmedById",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_trucker_pre_forecast_submissions_electronic_delivery_orders~1",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropForeignKey(
                name: "FK_trucker_pre_forecast_submissions_terminal_slots_AssignedSlot~",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropForeignKey(
                name: "FK_trucker_pre_forecast_submissions_terminals_AssignedTerminalId",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropForeignKey(
                name: "FK_trucker_pre_forecast_submissions_terminals_PreferredTerminal~",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropForeignKey(
                name: "FK_trucker_pre_forecast_submissions_users_CyConfirmedById",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropIndex(
                name: "IX_trucker_pre_forecast_submissions_AssignedSlotId",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropIndex(
                name: "IX_trucker_pre_forecast_submissions_AssignedTerminalId",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropIndex(
                name: "IX_trucker_pre_forecast_submissions_CyConfirmedById",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropIndex(
                name: "IX_trucker_pre_forecast_submissions_NewEdoId",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropIndex(
                name: "IX_trucker_pre_forecast_submissions_PreferredTerminalId",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropIndex(
                name: "IX_trucker_pre_forecast_submissions_Status",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropColumn(
                name: "AssignedSlotId",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropColumn(
                name: "AssignedTerminalId",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropColumn(
                name: "CyConfirmedAt",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropColumn(
                name: "CyConfirmedById",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropColumn(
                name: "CyConfirmedReturnDate",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropColumn(
                name: "CyNotes",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropColumn(
                name: "NewEdoId",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropColumn(
                name: "PreferredTerminalId",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropColumn(
                name: "TerminalNotes",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropColumn(
                name: "PaymentReceiptPath",
                table: "edo_renewal_requests");

            migrationBuilder.DropColumn(
                name: "PaymentReference",
                table: "edo_renewal_requests");
        }
    }
}
