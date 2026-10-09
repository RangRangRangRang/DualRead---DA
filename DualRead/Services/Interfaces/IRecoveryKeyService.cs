using DualRead.Models;

namespace DualRead.Services.Interfaces;

public interface IRecoveryKeyService
{
    Task<RecoveryKey> GenerateNewKeyAsync();

    Task<RecoveryKey?> ValidateAsync(string code);

    Task<RecoveryKey?> GetByIdAsync(Guid id);
}
