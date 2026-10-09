using DualRead.Models;

namespace DualRead.Services.Interfaces;

public interface ICurrentRecoveryKeyAccessor
{
    Task<RecoveryKey?> GetCurrentAsync();

    void SetActiveKeyCookie(Guid recoveryKeyId);

    void ClearActiveKeyCookie();
}
