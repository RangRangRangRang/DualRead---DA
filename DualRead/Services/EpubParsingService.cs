using DualRead.Services.Interfaces;
using DualRead.ViewModels;
using HtmlAgilityPack;
using VersOne.Epub;
using VersOne.Epub.Options;

namespace DualRead.Services;

public class EpubParsingService : IEpubParsingService
{
    private static readonly EpubReaderOptions RelaxedOptions = CreateRelaxedOptions();

    private static EpubReaderOptions CreateRelaxedOptions()
    {
        var options = new EpubReaderOptions();
        options.PackageReaderOptions.SkipInvalidManifestItems = true;
        options.PackageReaderOptions.IgnoreMissingToc = true;
        options.ContentReaderOptions.IgnoreMissingFileError = true;
        return options;
    }

    public async Task<ParsedEpubResult> ParseAsync(string absoluteEpubFilePath)
    {
        var epubBook = await ReadBookOrThrowAsync(absoluteEpubFilePath);

        var result = new ParsedEpubResult
        {
            Title = string.IsNullOrWhiteSpace(epubBook.Title) ? Path.GetFileNameWithoutExtension(absoluteEpubFilePath) : epubBook.Title,
            Author = epubBook.AuthorList is { Count: > 0 } ? string.Join(", ", epubBook.AuthorList) : epubBook.Author
        };

        if (epubBook.CoverImage is { Length: > 0 })
        {
            result.CoverImageBytes = epubBook.CoverImage;
            result.CoverImageExtension = DetectImageExtension(epubBook.CoverImage);
        }
        else
        {
            var fallbackCover = FindFallbackCoverImage(epubBook);
            if (fallbackCover is not null)
            {
                result.CoverImageBytes = fallbackCover.Value.Bytes;
                result.CoverImageExtension = DetectImageExtension(fallbackCover.Value.Bytes);
            }
        }

        result.Chapters = BuildChapterList(epubBook);

        return result;
    }

    public async Task<string> GetChapterHtmlAsync(string absoluteEpubFilePath, string epubItemHref)
    {
        var epubBook = await ReadBookOrThrowAsync(absoluteEpubFilePath);

        var item = epubBook.ReadingOrder.FirstOrDefault(f => f.FilePath.EndsWith(epubItemHref, StringComparison.OrdinalIgnoreCase))
                   ?? epubBook.Content.Html.Local.FirstOrDefault(f => f.FilePath.EndsWith(epubItemHref, StringComparison.OrdinalIgnoreCase));

        if (item is null)
        {
            throw new FileNotFoundException($"Chapter content not found for href '{epubItemHref}'.");
        }

        return item.Content;
    }

    public async Task<(byte[] Bytes, string ContentType)?> GetAssetAsync(string absoluteEpubFilePath, string chapterHref, string assetRelativeSrc)
    {
        var cleanSrc = assetRelativeSrc.Split('#')[0].Split('?')[0];
        if (string.IsNullOrWhiteSpace(cleanSrc)) return null;

        var resolvedPath = ResolveRelativePath(chapterHref, cleanSrc);
        var fileName = Path.GetFileName(resolvedPath);

        var epubBook = await ReadBookOrThrowAsync(absoluteEpubFilePath);

        var image = epubBook.Content.Images.Local
            .FirstOrDefault(f => f.FilePath.EndsWith(resolvedPath, StringComparison.OrdinalIgnoreCase))
            ?? epubBook.Content.Images.Local
            .FirstOrDefault(f => f.FilePath.EndsWith(fileName, StringComparison.OrdinalIgnoreCase));

        if (image is not null)
        {
            var contentType = string.IsNullOrWhiteSpace(image.ContentMimeType) ? GuessMimeTypeFromExtension(fileName) : image.ContentMimeType;
            return (image.Content, contentType);
        }

        var anyFile = epubBook.Content.AllFiles.Local
            .OfType<EpubLocalByteContentFile>()
            .FirstOrDefault(f => f.FilePath.EndsWith(resolvedPath, StringComparison.OrdinalIgnoreCase))
            ?? epubBook.Content.AllFiles.Local
            .OfType<EpubLocalByteContentFile>()
            .FirstOrDefault(f => f.FilePath.EndsWith(fileName, StringComparison.OrdinalIgnoreCase));

        if (anyFile is null) return null;

        var fallbackContentType = string.IsNullOrWhiteSpace(anyFile.ContentMimeType) ? GuessMimeTypeFromExtension(fileName) : anyFile.ContentMimeType;
        return (anyFile.Content, fallbackContentType);
    }

    private static async Task<EpubBook> ReadBookOrThrowAsync(string absoluteEpubFilePath)
    {
        var epubBook = await EpubReader.ReadBookAsync(absoluteEpubFilePath, RelaxedOptions);
        if (epubBook is null)
        {
            throw new InvalidDataException("Không thể đọc file EPUB này - file có thể bị hỏng hoặc không đúng chuẩn EPUB.");
        }
        return epubBook;
    }

    private static (byte[] Bytes, string ContentType)? FindFallbackCoverImage(EpubBook epubBook)
    {
        const int maxSpineItemsToScan = 3;
        (byte[] Bytes, string ContentType)? best = null;

        foreach (var spineItem in epubBook.ReadingOrder.Take(maxSpineItemsToScan))
        {
            var doc = new HtmlDocument();
            doc.LoadHtml(spineItem.Content);

            var imgNodes = doc.DocumentNode.SelectNodes("//img[@src]");
            if (imgNodes is null) continue;

            foreach (var imgNode in imgNodes)
            {
                var src = imgNode.Attributes["src"]?.Value;
                if (string.IsNullOrWhiteSpace(src)) continue;

                var cleanSrc = src.Split('#')[0].Split('?')[0];
                var resolvedPath = ResolveRelativePath(spineItem.FilePath, cleanSrc);
                var fileName = Path.GetFileName(resolvedPath);

                var image = epubBook.Content.Images.Local
                    .FirstOrDefault(f => f.FilePath.EndsWith(resolvedPath, StringComparison.OrdinalIgnoreCase))
                    ?? epubBook.Content.Images.Local
                    .FirstOrDefault(f => f.FilePath.EndsWith(fileName, StringComparison.OrdinalIgnoreCase));

                if (image is null) continue;

                if (best is null || image.Content.Length > best.Value.Bytes.Length)
                {
                    var contentType = string.IsNullOrWhiteSpace(image.ContentMimeType) ? GuessMimeTypeFromExtension(fileName) : image.ContentMimeType;
                    best = (image.Content, contentType);
                }
            }
        }

        return best;
    }

    private static List<ParsedChapter> BuildChapterList(EpubBook epubBook)
    {
        var titleByHref = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        if (epubBook.Navigation is { Count: > 0 })
        {
            void Walk(IEnumerable<EpubNavigationItem> items)
            {
                foreach (var navItem in items)
                {
                    if (navItem.Link is not null && !string.IsNullOrWhiteSpace(navItem.Link.ContentFilePath)
                        && !string.IsNullOrWhiteSpace(navItem.Title))
                    {
                        titleByHref.TryAdd(navItem.Link.ContentFilePath, navItem.Title);
                    }

                    if (navItem.NestedItems is { Count: > 0 })
                    {
                        Walk(navItem.NestedItems);
                    }
                }
            }
            Walk(epubBook.Navigation);
        }

        var chapters = new List<ParsedChapter>();
        var order = 0;

        foreach (var spineItem in epubBook.ReadingOrder)
        {
            var matchedTitle = titleByHref
                .FirstOrDefault(kv => spineItem.FilePath.EndsWith(kv.Key, StringComparison.OrdinalIgnoreCase)
                                       || kv.Key.EndsWith(spineItem.FilePath, StringComparison.OrdinalIgnoreCase))
                .Value;

            chapters.Add(new ParsedChapter
            {
                Order = order,
                Title = string.IsNullOrWhiteSpace(matchedTitle) ? $"Chapter {order + 1}" : matchedTitle,
                EpubItemHref = spineItem.FilePath
            });
            order++;
        }

        return chapters;
    }

    private static string GuessMimeTypeFromExtension(string fileName)
    {
        return Path.GetExtension(fileName).ToLowerInvariant() switch
        {
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".gif" => "image/gif",
            ".svg" => "image/svg+xml",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };
    }

    private static string ResolveRelativePath(string basePath, string relative)
    {
        if (relative.StartsWith('/')) return relative.TrimStart('/');

        var baseDir = basePath.Contains('/') ? basePath[..basePath.LastIndexOf('/')] : string.Empty;
        var segments = string.IsNullOrEmpty(baseDir)
            ? new List<string>()
            : baseDir.Split('/').ToList();

        foreach (var segment in relative.Split('/'))
        {
            if (segment is "." or "") continue;
            if (segment == "..")
            {
                if (segments.Count > 0) segments.RemoveAt(segments.Count - 1);
            }
            else
            {
                segments.Add(segment);
            }
        }

        return string.Join('/', segments);
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
