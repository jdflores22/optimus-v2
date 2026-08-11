using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Optimus.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenamePreAdviceToPreForecast : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameTable(
                name: "pre_advice_requests",
                newName: "pre_forecast_requests");

            migrationBuilder.RenameColumn(
                name: "PreAdviceRequestId",
                table: "geotag_photos",
                newName: "PreForecastRequestId");

            migrationBuilder.Sql(
                "UPDATE `containers` SET `Status` = 'PreForecastApproved' WHERE `Status` = 'PaApproved';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "UPDATE `containers` SET `Status` = 'PaApproved' WHERE `Status` = 'PreForecastApproved';");

            migrationBuilder.RenameColumn(
                name: "PreForecastRequestId",
                table: "geotag_photos",
                newName: "PreAdviceRequestId");

            migrationBuilder.RenameTable(
                name: "pre_forecast_requests",
                newName: "pre_advice_requests");
        }
    }
}
