using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DualRead.Data;
using DualRead.Models;
using DualRead.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using W = DocumentFormat.OpenXml.Wordprocessing;

namespace DualRead.Services.Implementations;

public class TranslationExportService : ITranslationExportService
{
    private readonly AppDbContext _db;

    public TranslationExportService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<(byte[] Bytes, string FileName)?> ExportTranslationToDocxAsync(Guid bookId, Guid recoveryKeyId)
    {
        var book = await _db.Books
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == bookId && b.RecoveryKeyId == recoveryKeyId);
        if (book is null)
        {
            return null;
        }

        var chapters = await _db.Chapters
            .Where(c => c.BookId == bookId)
            .OrderBy(c => c.Order)
            .AsNoTracking()
            .ToListAsync();

        var translations = await _db.Translations
            .Where(t => t.BookId == bookId)
            .AsNoTracking()
            .ToListAsync();

        var translationsByChapter = translations
            .GroupBy(t => t.ChapterId)
            .ToDictionary(g => g.Key, g => g.OrderBy(t => t.ParagraphIndex).ToList());

        var bytes = BuildDocx(book.Title, book.Author, chapters, translationsByChapter);
        var fileName = $"{SanitizeFileName(book.Title)}-ban-dich.docx";

        return (bytes, fileName);
    }

    private static byte[] BuildDocx(
        string bookTitle,
        string? author,
        List<Chapter> chapters,
        Dictionary<Guid, List<Translation>> translationsByChapter)
    {
        using var stream = new MemoryStream();

        using (var wordDocument = WordprocessingDocument.Create(stream, WordprocessingDocumentType.Document))
        {
            var mainPart = wordDocument.AddMainDocumentPart();
            mainPart.Document = new W.Document();
            var body = mainPart.Document.AppendChild(new W.Body());

            body.AppendChild(CreateParagraph(bookTitle, bold: true, fontSizeHalfPoints: 36));

            if (!string.IsNullOrWhiteSpace(author))
            {
                body.AppendChild(CreateParagraph($"Tác giả: {author}", italic: true, fontSizeHalfPoints: 22));
            }

            body.AppendChild(CreateParagraph(string.Empty));

            var hasAnyTranslation = false;

            foreach (var chapter in chapters)
            {
                if (!translationsByChapter.TryGetValue(chapter.Id, out var paragraphs))
                {
                    continue;
                }

                var nonEmptyParagraphs = paragraphs.Where(p => !string.IsNullOrWhiteSpace(p.TranslatedText)).ToList();
                if (nonEmptyParagraphs.Count == 0)
                {
                    continue;
                }

                hasAnyTranslation = true;

                body.AppendChild(CreateParagraph(chapter.Title, bold: true, fontSizeHalfPoints: 28));

                foreach (var paragraph in nonEmptyParagraphs)
                {
                    body.AppendChild(CreateParagraph(paragraph.TranslatedText));
                }

                body.AppendChild(CreateParagraph(string.Empty));
            }

            if (!hasAnyTranslation)
            {
                body.AppendChild(CreateParagraph("Chưa có đoạn dịch nào được lưu cho sách này.", italic: true));
            }

            body.AppendChild(new W.SectionProperties(
                new W.PageSize { Width = 11906U, Height = 16838U },
                new W.PageMargin { Top = 1134, Bottom = 1134, Left = 1134, Right = 1134 }));
        }

        return stream.ToArray();
    }

    private static W.Paragraph CreateParagraph(string text, bool bold = false, bool italic = false, int fontSizeHalfPoints = 24)
    {
        var runProperties = new W.RunProperties(
            new W.RunFonts { Ascii = "Times New Roman", HighAnsi = "Times New Roman", ComplexScript = "Times New Roman" });

        if (bold) runProperties.Append(new W.Bold());
        if (italic) runProperties.Append(new W.Italic());
        runProperties.Append(new W.FontSize { Val = fontSizeHalfPoints.ToString() });

        var run = new W.Run(
            runProperties,
            new W.Text(text) { Space = SpaceProcessingModeValues.Preserve });

        var paragraphProperties = new W.ParagraphProperties(
            new W.SpacingBetweenLines { After = "240", Line = "360", LineRule = W.LineSpacingRuleValues.Auto });

        return new W.Paragraph(paragraphProperties, run);
    }

    private static string SanitizeFileName(string name)
    {
        var sanitized = name;
        foreach (var invalidChar in Path.GetInvalidFileNameChars())
        {
            sanitized = sanitized.Replace(invalidChar, '-');
        }

        sanitized = sanitized.Trim();
        return string.IsNullOrEmpty(sanitized) ? "book" : sanitized;
    }
}
