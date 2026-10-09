using DualRead.Models;

namespace DualRead.Services.Interfaces;

public interface ITranslationService
{
    Task<List<Translation>> GetByChapterAsync(Guid chapterId);

    Task UpsertAsync(Guid bookId, Guid chapterId, int paragraphIndex, string translatedText);
}
