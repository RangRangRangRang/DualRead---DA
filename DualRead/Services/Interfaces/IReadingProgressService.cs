using DualRead.Models;

namespace DualRead.Services.Interfaces;

public interface IReadingProgressService
{
    Task<ReadingProgress?> GetByBookIdAsync(Guid bookId);

    Task SaveAsync(Guid bookId, Guid? chapterId, int page);
}
