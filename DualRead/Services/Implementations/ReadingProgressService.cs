using DualRead.Data;
using DualRead.Models;
using DualRead.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DualRead.Services.Implementations;

public class ReadingProgressService : IReadingProgressService
{
    private readonly AppDbContext _db;

    public ReadingProgressService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ReadingProgress?> GetByBookIdAsync(Guid bookId)
    {
        return await _db.ReadingProgresses.AsNoTracking().FirstOrDefaultAsync(rp => rp.BookId == bookId);
    }

    public async Task SaveAsync(Guid bookId, Guid? chapterId, int page)
    {
        var existing = await _db.ReadingProgresses.FirstOrDefaultAsync(rp => rp.BookId == bookId);

        if (existing is null)
        {
            _db.ReadingProgresses.Add(new ReadingProgress
            {
                BookId = bookId,
                CurrentChapterId = chapterId,
                CurrentPage = page,
                UpdatedAtUtc = DateTime.UtcNow
            });
        }
        else
        {
            existing.CurrentChapterId = chapterId;
            existing.CurrentPage = page;
            existing.UpdatedAtUtc = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
    }
}
