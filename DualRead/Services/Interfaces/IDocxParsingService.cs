using DualRead.ViewModels;

namespace DualRead.Services.Interfaces;

public interface IDocxParsingService
{
    Task<ParsedEpubResult> ParseAsync(string absoluteDocxFilePath);

    Task<string> GetChapterHtmlAsync(string absoluteDocxFilePath, string chapterHref);
}
