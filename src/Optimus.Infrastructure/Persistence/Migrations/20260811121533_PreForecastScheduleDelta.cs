using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Optimus.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PreForecastScheduleDelta : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "DetentionAtPreferredDate",
                table: "trucker_pre_forecast_submissions",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ExtraDaysDetentionAmount",
                table: "trucker_pre_forecast_submissions",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "ExtraDaysWaived",
                table: "trucker_pre_forecast_submissions",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ScheduleDeltaDays",
                table: "trucker_pre_forecast_submissions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "TruckerPreferredReturnDate",
                table: "trucker_pre_forecast_submissions",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(2000, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.Sql(
                """
                UPDATE trucker_pre_forecast_submissions
                SET TruckerPreferredReturnDate = ReturnDate
                WHERE TruckerPreferredReturnDate = '2000-01-01 00:00:00';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DetentionAtPreferredDate",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropColumn(
                name: "ExtraDaysDetentionAmount",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropColumn(
                name: "ExtraDaysWaived",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropColumn(
                name: "ScheduleDeltaDays",
                table: "trucker_pre_forecast_submissions");

            migrationBuilder.DropColumn(
                name: "TruckerPreferredReturnDate",
                table: "trucker_pre_forecast_submissions");
        }
    }
}
