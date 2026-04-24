using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddSearchIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_SR_AnalysisReq",
                table: "SampleReceptions",
                column: "AnalysisRequestNumber");

            migrationBuilder.CreateIndex(
                name: "IX_SR_Declaration",
                table: "SampleReceptions",
                column: "DeclarationNumber");

            migrationBuilder.CreateIndex(
                name: "IX_SR_Notification",
                table: "SampleReceptions",
                column: "NotificationNumber");

            migrationBuilder.CreateIndex(
                name: "IX_Cert_Notification",
                table: "Certificates",
                column: "NotificationNumber");

            migrationBuilder.CreateIndex(
                name: "IX_Cert_Receipt",
                table: "Certificates",
                column: "FinancialReceiptNumber");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SR_AnalysisReq",
                table: "SampleReceptions");

            migrationBuilder.DropIndex(
                name: "IX_SR_Declaration",
                table: "SampleReceptions");

            migrationBuilder.DropIndex(
                name: "IX_SR_Notification",
                table: "SampleReceptions");

            migrationBuilder.DropIndex(
                name: "IX_Cert_Notification",
                table: "Certificates");

            migrationBuilder.DropIndex(
                name: "IX_Cert_Receipt",
                table: "Certificates");
        }
    }
}
