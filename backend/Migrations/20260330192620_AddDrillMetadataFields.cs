using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddDrillMetadataFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "category",
                table: "drills",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "description",
                table: "drills",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "difficulty",
                table: "drills",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "duration_minutes",
                table: "drills",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string[]>(
                name: "position_tags",
                table: "drills",
                type: "text[]",
                nullable: false,
                defaultValue: new string[0]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "category",
                table: "drills");

            migrationBuilder.DropColumn(
                name: "description",
                table: "drills");

            migrationBuilder.DropColumn(
                name: "difficulty",
                table: "drills");

            migrationBuilder.DropColumn(
                name: "duration_minutes",
                table: "drills");

            migrationBuilder.DropColumn(
                name: "position_tags",
                table: "drills");
        }
    }
}
