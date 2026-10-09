using DualRead.Data;
using DualRead.Models;
using DualRead.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DualRead.Services.Implementations;

public class VocabularyService : IVocabularyService
{
    private readonly AppDbContext _db;

    public VocabularyService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<VocabularyItem>> GetAllByRecoveryKeyAsync(Guid recoveryKeyId)
    {
        return await _db.VocabularyItems
            .Where(v => v.RecoveryKeyId == recoveryKeyId)
            .OrderByDescending(v => v.CreatedAtUtc)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<VocabularyItem>> GetByBookIdAsync(Guid recoveryKeyId, Guid bookId)
    {
        return await _db.VocabularyItems
            .Where(v => v.RecoveryKeyId == recoveryKeyId && v.BookId == bookId)
            .OrderByDescending(v => v.CreatedAtUtc)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<VocabularyItem> AddAsync(VocabularyItem item)
    {
        _db.VocabularyItems.Add(item);
        await _db.SaveChangesAsync();
        return item;
    }

    public async Task<bool> DeleteAsync(Guid recoveryKeyId, Guid id)
    {
        var item = await _db.VocabularyItems.FirstOrDefaultAsync(v => v.Id == id && v.RecoveryKeyId == recoveryKeyId);
        if (item is null)
        {
            return false;
        }

        _db.VocabularyItems.Remove(item);
        await _db.SaveChangesAsync();
        return true;
    }
}
