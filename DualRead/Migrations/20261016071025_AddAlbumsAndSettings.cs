using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DualRead.Migrations
{
    /// <inheritdoc />
    public partial class AddAlbumsAndSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Albums",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RecoveryKeyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Albums", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Albums_RecoveryKeys_RecoveryKeyId",
                        column: x => x.RecoveryKeyId,
                        principalTable: "RecoveryKeys",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Settings",
                columns: table => new
                {
                    RecoveryKeyId = table.Column<Guid>(type: "uuid", nullable: false),
                    DarkMode = table.Column<bool>(type: "boolean", nullable: false),
                    Language = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Font = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FontSize = table.Column<int>(type: "integer", nullable: false),
                    LineHeight = table.Column<double>(type: "double precision", nullable: false),
                    LetterSpacing = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Settings", x => x.RecoveryKeyId);
                    table.ForeignKey(
                        name: "FK_Settings_RecoveryKeys_RecoveryKeyId",
                        column: x => x.RecoveryKeyId,
                        principalTable: "RecoveryKeys",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AlbumBooks",
                columns: table => new
                {
                    AlbumId = table.Column<Guid>(type: "uuid", nullable: false),
                    BookId = table.Column<Guid>(type: "uuid", nullable: false),
                    AddedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlbumBooks", x => new { x.AlbumId, x.BookId });
                    table.ForeignKey(
                        name: "FK_AlbumBooks_Albums_AlbumId",
                        column: x => x.AlbumId,
                        principalTable: "Albums",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AlbumBooks_Books_BookId",
                        column: x => x.BookId,
                        principalTable: "Books",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AlbumBooks_BookId",
                table: "AlbumBooks",
                column: "BookId");

            migrationBuilder.CreateIndex(
                name: "IX_Albums_RecoveryKeyId",
                table: "Albums",
                column: "RecoveryKeyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AlbumBooks");

            migrationBuilder.DropTable(
                name: "Settings");

            migrationBuilder.DropTable(
                name: "Albums");
        }
    }
}
