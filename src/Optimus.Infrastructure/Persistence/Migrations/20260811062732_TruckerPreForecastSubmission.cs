using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Optimus.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class TruckerPreForecastSubmission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AssignedTerminalIdsJson",
                table: "users",
                type: "json",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ContainerYardUser_Department",
                table: "users",
                type: "varchar(120)",
                maxLength: 120,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "trucker_pre_forecast_submissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    TruckerId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ContainerId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ExpiredEdoId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    RenewalRequestId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    ReturnDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ReleaseDocumentPath = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(40)", maxLength: 40, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DetentionAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    OverdueDays = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_trucker_pre_forecast_submissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_trucker_pre_forecast_submissions_containers_ContainerId",
                        column: x => x.ContainerId,
                        principalTable: "containers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_trucker_pre_forecast_submissions_edo_renewal_requests_Renewa~",
                        column: x => x.RenewalRequestId,
                        principalTable: "edo_renewal_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_trucker_pre_forecast_submissions_electronic_delivery_orders_~",
                        column: x => x.ExpiredEdoId,
                        principalTable: "electronic_delivery_orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_trucker_pre_forecast_submissions_users_TruckerId",
                        column: x => x.TruckerId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_trucker_pre_forecast_submissions_ContainerId_CreatedAt",
                table: "trucker_pre_forecast_submissions",
                columns: new[] { "ContainerId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_trucker_pre_forecast_submissions_ExpiredEdoId",
                table: "trucker_pre_forecast_submissions",
                column: "ExpiredEdoId");

            migrationBuilder.CreateIndex(
                name: "IX_trucker_pre_forecast_submissions_RenewalRequestId",
                table: "trucker_pre_forecast_submissions",
                column: "RenewalRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_trucker_pre_forecast_submissions_TruckerId",
                table: "trucker_pre_forecast_submissions",
                column: "TruckerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "trucker_pre_forecast_submissions");

            migrationBuilder.DropColumn(
                name: "AssignedTerminalIdsJson",
                table: "users");

            migrationBuilder.DropColumn(
                name: "ContainerYardUser_Department",
                table: "users");
        }
    }
}
