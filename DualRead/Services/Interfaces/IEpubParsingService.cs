using DualRead.ViewModels;

namespace DualRead.Services.Interfaces;

public interface IEpubParsingService
{
    Task<ParsedEpubResult> ParseAsync(string absoluteEpubFilePath);

    Task<string> GetChapterHtmlAsync(string absoluteEpubFilePath, string epubItemHref);

    Task<(byte[] Bytes, string ContentType)?> GetAssetAsync(string absoluteEpubFilePath, string chapterHref, string assetRelativeSrc);
}
