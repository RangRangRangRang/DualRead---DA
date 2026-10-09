using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DualRead.Migrations
{
    /// <inheritdoc />
    public partial class InitDatabase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "TranslationModeOn",
                table: "ReadingProgresses",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "RecoveryKeyId",
                table: "Books",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "RecoveryKeys",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastAccessedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecoveryKeys", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Translations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChapterId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParagraphIndex = table.Column<int>(type: "integer", nullable: false),
                    TranslatedText = table.Column<string>(type: "text", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Translations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Translations_Books_BookId",
                        column: x => x.BookId,
                        principalTable: "Books",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Translations_Chapters_ChapterId",
                        column: x => x.ChapterId,
                        principalTable: "Chapters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VocabularyItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RecoveryKeyId = table.Column<Guid>(type: "uuid", nullable: false),
                    BookId = table.Column<Guid>(type: "uuid", nullable: true),
                    BookTitle = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    ChapterId = table.Column<Guid>(type: "uuid", nullable: true),
                    ChapterTitle = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    OriginalText = table.Column<string>(type: "text", nullable: false),
                    TranslatedText = table.Column<string>(type: "text", nullable: false),
                    ContextText = table.Column<string>(type: "text", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VocabularyItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VocabularyItems_Books_BookId",
                        column: x => x.BookId,
                        principalTable: "Books",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_VocabularyItems_RecoveryKeys_RecoveryKeyId",
                        column: x => x.RecoveryKeyId,
                        principalTable: "RecoveryKeys",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Books_RecoveryKeyId",
                table: "Books",
                column: "RecoveryKeyId");

            migrationBuilder.CreateIndex(
                name: "IX_RecoveryKeys_Code",
                table: "RecoveryKeys",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Translations_BookId",
                table: "Translations",
                column: "BookId");

            migrationBuilder.CreateIndex(
                name: "IX_Translations_ChapterId_ParagraphIndex",
                table: "Translations",
                columns: new[] { "ChapterId", "ParagraphIndex" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VocabularyItems_BookId",
                table: "VocabularyItems",
                column: "BookId");

            migrationBuilder.CreateIndex(
                name: "IX_VocabularyItems_RecoveryKeyId",
                table: "VocabularyItems",
                column: "RecoveryKeyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Books_RecoveryKeys_RecoveryKeyId",
                table: "Books",
                column: "RecoveryKeyId",
                principalTable: "RecoveryKeys",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Books_RecoveryKeys_RecoveryKeyId",
                table: "Books");

            migrationBuilder.DropTable(
                name: "Translations");

            migrationBuilder.DropTable(
                name: "VocabularyItems");

            migrationBuilder.DropTable(
                name: "RecoveryKeys");

            migrationBuilder.DropIndex(
                name: "IX_Books_RecoveryKeyId",
                table: "Books");

            migrationBuilder.DropColumn(
                name: "TranslationModeOn",
                table: "ReadingProgresses");

            migrationBuilder.DropColumn(
                name: "RecoveryKeyId",
                table: "Books");
        }
    }
}
