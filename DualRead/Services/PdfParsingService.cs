using System.Net;
using System.Text;
using DualRead.Services.Interfaces;
using DualRead.ViewModels;
using UglyToad.PdfPig;

namespace DualRead.Services;

public class PdfParsingService : IPdfParsingService
{
    private const int PagesPerChapter = 15;

    public Task<ParsedEpubResult> ParseAsync(string absolutePdfFilePath)
    {
        if (!File.Exists(absolutePdfFilePath))
        {
            throw new FileNotFoundException($"File not found: {absolutePdfFilePath}");
        }

        using var document = PdfDocument.Open(absolutePdfFilePath);

        var title = document.Information.Title;
        var author = document.Information.Author;

        var finalTitle = string.IsNullOrWhiteSpace(title)
            ? Path.GetFileNameWithoutExtension(absolutePdfFilePath)
            : title.Trim();

        var (coverBytes, coverExt) = ExtractCoverImage(document);

        var totalPages = document.NumberOfPages;
        var chapters = new List<ParsedChapter>();
        var order = 0;

        for (var startPage = 1; startPage <= totalPages; startPage += PagesPerChapter)
        {
            var endPage = Math.Min(startPage + PagesPerChapter - 1, totalPages);
            chapters.Add(new ParsedChapter
            {
                Order = order,
                Title = totalPages <= PagesPerChapter ? finalTitle : $"Trang {startPage}-{endPage}",
                EpubItemHref = $"{startPage}-{endPage}"
            });
            order++;
        }

        if (chapters.Count == 0)
        {
            chapters.Add(new ParsedChapter { Order = 0, Title = finalTitle, EpubItemHref = "1-1" });
        }

        var result = new ParsedEpubResult
        {
            Title = finalTitle,
            Author = string.IsNullOrWhiteSpace(author) ? null : author.Trim(),
            CoverImageBytes = coverBytes,
            CoverImageExtension = coverExt,
            Chapters = chapters
        };

        return Task.FromResult(result);
    }

    public Task<string> GetChapterHtmlAsync(string absolutePdfFilePath, string chapterHref)
    {
        if (!File.Exists(absolutePdfFilePath))
        {
            throw new FileNotFoundException($"File not found: {absolutePdfFilePath}");
        }

        var (startPage, endPage) = ParseRange(chapterHref);

        using var document = PdfDocument.Open(absolutePdfFilePath);
        var totalPages = document.NumberOfPages;
        startPage = Math.Max(1, startPage);
        endPage = Math.Min(endPage, totalPages);

        var sb = new StringBuilder();

        for (var pageNum = startPage; pageNum <= endPage; pageNum++)
        {
            var page = document.GetPage(pageNum);
            var text = page.Text ?? string.Empty;

            sb.Append("<div class=\"pdf-page-wrapper\" data-page-number=\"").Append(pageNum).Append("\">");
            if (totalPages > 1)
            {
                sb.Append("<div class=\"pdf-page-marker\"><small>Trang ").Append(pageNum).Append('/').Append(totalPages).Append("</small></div>");
            }
            foreach (var paragraph in SplitIntoParagraphs(text))
            {
                sb.Append("<p>").Append(WebUtility.HtmlEncode(paragraph)).Append("</p>");
            }
            sb.Append("</div>");
        }

        return Task.FromResult(sb.ToString());
    }

    private static IEnumerable<string> SplitIntoParagraphs(string text)
    {
        var lines = text.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        var buffer = new StringBuilder();

        foreach (var rawLine in lines)
        {
            var line = rawLine.Trim();
            if (line.Length == 0)
            {
                if (buffer.Length > 0)
                {
                    yield return buffer.ToString();
                    buffer.Clear();
                }
                continue;
            }

            if (buffer.Length > 0) buffer.Append(' ');
            buffer.Append(line);
        }

        if (buffer.Length > 0)
        {
            yield return buffer.ToString();
        }
    }

    private static (int Start, int End) ParseRange(string chapterHref)
    {
        var parts = chapterHref.Split('-');
        if (parts.Length == 2 && int.TryParse(parts[0], out var start) && int.TryParse(parts[1], out var end))
        {
            return (start, end);
        }
        return (1, 1);
    }

    private static (byte[]? Bytes, string? Extension) ExtractCoverImage(PdfDocument document)
    {
        try
        {
            if (document.NumberOfPages == 0) return (null, null);

            var firstPage = document.GetPage(1);
            var images = firstPage.GetImages().ToList();
            if (images.Count == 0) return (null, null);

            var largest = images.OrderByDescending(img => img.RawBytes.Length).First();
            var bytes = largest.RawBytes.ToArray();
            if (bytes.Length == 0) return (null, null);

            return (bytes, DetectImageExtension(bytes));
        }
        catch
        {
            return (null, null);
        }
    }

    private static string DetectImageExtension(byte[] bytes)
    {
        if (bytes.Length >= 8 && bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47)
            return ".png";
        if (bytes.Length >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8)
            return ".jpg";
        if (bytes.Length >= 6 && bytes[0] == 'G' && bytes[1] == 'I' && bytes[2] == 'F')
            return ".gif";
        return ".jpg";
    }
}
