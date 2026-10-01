using DualRead.ViewModels;

namespace DualRead.Services.Interfaces;

public interface IPdfParsingService
{
    Task<ParsedEpubResult> ParseAsync(string absolutePdfFilePath);

    Task<string> GetChapterHtmlAsync(string absolutePdfFilePath, string chapterHref);
}
