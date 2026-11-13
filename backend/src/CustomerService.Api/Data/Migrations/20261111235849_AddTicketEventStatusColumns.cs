using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CustomerService.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketEventStatusColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FromStatus",
                table: "TicketEvents",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ToStatus",
                table: "TicketEvents",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FromStatus",
                table: "TicketEvents");

            migrationBuilder.DropColumn(
                name: "ToStatus",
                table: "TicketEvents");
        }
    }
}
