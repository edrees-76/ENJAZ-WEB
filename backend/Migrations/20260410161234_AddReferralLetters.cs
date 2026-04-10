using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddReferralLetters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "MeasurementDate",
                table: "Samples",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "TEXT");

            migrationBuilder.CreateTable(
                name: "ReferralLetters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ReferenceNumber = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    SenderName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    CertificateCount = table.Column<int>(type: "INTEGER", nullable: false),
                    SampleCount = table.Column<int>(type: "INTEGER", nullable: false),
                    StartDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EndDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IncludedColumns = table.Column<int>(type: "INTEGER", nullable: false),
                    PdfPath = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    TemplateVersion = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedByName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    IsDeleted = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReferralLetters", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ReferralLetterCertificates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ReferralLetterId = table.Column<int>(type: "INTEGER", nullable: false),
                    CertificateId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReferralLetterCertificates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReferralLetterCertificates_Certificates_CertificateId",
                        column: x => x.CertificateId,
                        principalTable: "Certificates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReferralLetterCertificates_ReferralLetters_ReferralLetterId",
                        column: x => x.ReferralLetterId,
                        principalTable: "ReferralLetters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Certificates_CertificateType",
                table: "Certificates",
                column: "CertificateType");

            migrationBuilder.CreateIndex(
                name: "IX_Certificates_IssueDate",
                table: "Certificates",
                column: "IssueDate");

            migrationBuilder.CreateIndex(
                name: "IX_Certificates_Sender",
                table: "Certificates",
                column: "Sender");

            migrationBuilder.CreateIndex(
                name: "IX_ReferralLetterCertificates_CertificateId",
                table: "ReferralLetterCertificates",
                column: "CertificateId");

            migrationBuilder.CreateIndex(
                name: "IX_ReferralLetterCertificates_ReferralLetterId",
                table: "ReferralLetterCertificates",
                column: "ReferralLetterId");

            migrationBuilder.CreateIndex(
                name: "IX_ReferralLetters_GeneratedAt",
                table: "ReferralLetters",
                column: "GeneratedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ReferralLetters_ReferenceNumber",
                table: "ReferralLetters",
                column: "ReferenceNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReferralLetters_SenderName",
                table: "ReferralLetters",
                column: "SenderName");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReferralLetterCertificates");

            migrationBuilder.DropTable(
                name: "ReferralLetters");

            migrationBuilder.DropIndex(
                name: "IX_Certificates_CertificateType",
                table: "Certificates");

            migrationBuilder.DropIndex(
                name: "IX_Certificates_IssueDate",
                table: "Certificates");

            migrationBuilder.DropIndex(
                name: "IX_Certificates_Sender",
                table: "Certificates");

            migrationBuilder.AlterColumn<DateTime>(
                name: "MeasurementDate",
                table: "Samples",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "TEXT",
                oldNullable: true);
        }
    }
}
