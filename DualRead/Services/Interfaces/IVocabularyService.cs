using DualRead.Models;

namespace DualRead.Services.Interfaces;

public interface IVocabularyService
{
    Task<List<VocabularyItem>> GetAllByRecoveryKeyAsync(Guid recoveryKeyId);

    Task<List<VocabularyItem>> GetByBookIdAsync(Guid recoveryKeyId, Guid bookId);

    Task<VocabularyItem> AddAsync(VocabularyItem item);

    Task<bool> DeleteAsync(Guid recoveryKeyId, Guid id);
}
