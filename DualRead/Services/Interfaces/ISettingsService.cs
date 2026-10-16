using DualRead.Models;
using DualRead.ViewModels;

namespace DualRead.Services.Interfaces;

public interface ISettingsService
{
    Task<Settings> GetAsync(Guid recoveryKeyId);

    Task<Settings> SaveAsync(Guid recoveryKeyId, SettingsUpdateDto update);
}
