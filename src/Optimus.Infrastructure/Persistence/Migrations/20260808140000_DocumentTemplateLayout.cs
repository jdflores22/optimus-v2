using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Optimus.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DocumentTemplateLayout : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LayoutJson",
                table: "document_templates",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Orientation",
                table: "document_templates",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "portrait")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "PaperSize",
                table: "document_templates",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "A4")
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LayoutJson",
                table: "document_templates");

            migrationBuilder.DropColumn(
                name: "Orientation",
                table: "document_templates");

            migrationBuilder.DropColumn(
                name: "PaperSize",
                table: "document_templates");
        }
    }
}
