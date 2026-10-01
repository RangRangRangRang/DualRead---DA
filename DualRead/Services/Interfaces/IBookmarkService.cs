using DualRead.Models;

namespace DualRead.Services.Interfaces;

public interface IBookmarkService
{
    Task<List<Bookmark>> GetByBookIdAsync(Guid bookId);

    Task<Bookmark> AddAsync(Guid bookId, Guid? chapterId, int page, string? previewText);

    Task<bool> DeleteAsync(Guid bookmarkId);
}
