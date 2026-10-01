using DualRead.Data;
using DualRead.Models;
using DualRead.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DualRead.Services.Implementations;

public class BookmarkService : IBookmarkService
{
    private readonly AppDbContext _db;

    public BookmarkService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<Bookmark>> GetByBookIdAsync(Guid bookId)
    {
        return await _db.Bookmarks
            .Where(b => b.BookId == bookId)
            .OrderByDescending(b => b.CreatedAtUtc)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Bookmark> AddAsync(Guid bookId, Guid? chapterId, int page, string? previewText)
    {
        var bookmark = new Bookmark
        {
            BookId = bookId,
            ChapterId = chapterId,
            PageNumber = page,
            PreviewText = string.IsNullOrWhiteSpace(previewText) ? null : previewText.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.Bookmarks.Add(bookmark);
        await _db.SaveChangesAsync();

        return bookmark;
    }

    public async Task<bool> DeleteAsync(Guid bookmarkId)
    {
        var bookmark = await _db.Bookmarks.FirstOrDefaultAsync(b => b.Id == bookmarkId);
        if (bookmark is null)
        {
            return false;
        }

        _db.Bookmarks.Remove(bookmark);
        await _db.SaveChangesAsync();

        return true;
    }
}
