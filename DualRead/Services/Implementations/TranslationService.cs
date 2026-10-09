using DualRead.Data;
using DualRead.Models;
using DualRead.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DualRead.Services.Implementations;

public class TranslationService : ITranslationService
{
    private readonly AppDbContext _db;

    public TranslationService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<Translation>> GetByChapterAsync(Guid chapterId)
    {
        return await _db.Translations
            .Where(t => t.ChapterId == chapterId)
            .OrderBy(t => t.ParagraphIndex)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task UpsertAsync(Guid bookId, Guid chapterId, int paragraphIndex, string translatedText)
    {
        var existing = await _db.Translations
            .FirstOrDefaultAsync(t => t.ChapterId == chapterId && t.ParagraphIndex == paragraphIndex);

        if (existing is null)
        {
            if (string.IsNullOrEmpty(translatedText))
            {
                return;
            }

            _db.Translations.Add(new Translation
            {
                BookId = bookId,
                ChapterId = chapterId,
                ParagraphIndex = paragraphIndex,
                TranslatedText = translatedText,
                UpdatedAtUtc = DateTime.UtcNow
            });

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                _db.ChangeTracker.Clear();

                var raced = await _db.Translations
                    .FirstOrDefaultAsync(t => t.ChapterId == chapterId && t.ParagraphIndex == paragraphIndex);
                if (raced is null)
                {
                    throw;
                }

                raced.TranslatedText = translatedText;
                raced.UpdatedAtUtc = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }

            return;
        }

        existing.TranslatedText = translatedText;
        existing.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }
}
