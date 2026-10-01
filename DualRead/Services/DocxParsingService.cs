using DocumentFormat.OpenXml.Packaging;
using DualRead.Services.Interfaces;
using DualRead.ViewModels;
using Mammoth;

namespace DualRead.Services;

public class DocxParsingService : IDocxParsingService
{
    public Task<ParsedEpubResult> ParseAsync(string absoluteDocxFilePath)
    {
        if (!File.Exists(absoluteDocxFilePath))
        {
            throw new FileNotFoundException($"File not found: {absoluteDocxFilePath}");
        }

        var (title, author) = ReadMetadata(absoluteDocxFilePath);
        var (coverBytes, coverExt) = ExtractCoverImage(absoluteDocxFilePath);

        var finalTitle = string.IsNullOrWhiteSpace(title)
            ? Path.GetFileNameWithoutExtension(absoluteDocxFilePath)
            : title.Trim();

        var chapters = new List<ParsedChapter>
        {
            new()
            {
                Order = 0,
                Title = finalTitle,
                EpubItemHref = "full"
            }
        };

        var result = new ParsedEpubResult
        {
            Title = finalTitle,
            Author = author,
            CoverImageBytes = coverBytes,
            CoverImageExtension = coverExt,
            Chapters = chapters
        };

        return Task.FromResult(result);
    }

    public Task<string> GetChapterHtmlAsync(string absoluteDocxFilePath, string chapterHref)
    {
        if (!File.Exists(absoluteDocxFilePath))
        {
            throw new FileNotFoundException($"File not found: {absoluteDocxFilePath}");
        }

        var converter = new DocumentConverter();
        var conversionResult = converter.ConvertToHtml(absoluteDocxFilePath);
        var fullHtml = conversionResult.Value ?? string.Empty;

        return Task.FromResult(fullHtml);
    }

    private static (string? Title, string? Author) ReadMetadata(string filePath)
    {
        try
        {
            using var doc = WordprocessingDocument.Open(filePath, false);
            var props = doc.PackageProperties;
            var title = string.IsNullOrWhiteSpace(props.Title) ? null : props.Title.Trim();
            var author = string.IsNullOrWhiteSpace(props.Creator) ? null : props.Creator.Trim();
            return (title, author);
        }
        catch
        {
            return (null, null);
        }
    }

    private static (byte[]? Bytes, string? Extension) ExtractCoverImage(string filePath)
    {
        try
        {
            using var doc = WordprocessingDocument.Open(filePath, false);
            var mainPart = doc.MainDocumentPart;
            if (mainPart == null) return (null, null);

            var firstImagePart = mainPart.ImageParts.FirstOrDefault();
            if (firstImagePart == null) return (null, null);

            using var stream = firstImagePart.GetStream();
            using var ms = new MemoryStream();
            stream.CopyTo(ms);
            var bytes = ms.ToArray();

            if (bytes.Length == 0) return (null, null);

            var contentType = firstImagePart.ContentType;
            var ext = contentType switch
            {
                "image/png" => ".png",
                "image/jpeg" or "image/jpg" => ".jpg",
                "image/gif" => ".gif",
                "image/webp" => ".webp",
                _ => ".jpg"
            };

            return (bytes, ext);
        }
        catch
        {
            return (null, null);
        }
    }
}
