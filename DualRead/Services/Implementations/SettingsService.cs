using DualRead.Data;
using DualRead.Models;
using DualRead.Services.Interfaces;
using DualRead.ViewModels;
using Microsoft.EntityFrameworkCore;

namespace DualRead.Services.Implementations;

public class SettingsService : ISettingsService
{
    private static readonly string[] SupportedLanguages = { "en", "vi" };

    private readonly AppDbContext _db;

    public SettingsService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Settings> GetAsync(Guid recoveryKeyId)
    {
        var settings = await _db.Settings.AsNoTracking().FirstOrDefaultAsync(s => s.RecoveryKeyId == recoveryKeyId);
        return settings ?? new Settings { RecoveryKeyId = recoveryKeyId };
    }

    public async Task<Settings> SaveAsync(Guid recoveryKeyId, SettingsUpdateDto update)
    {
        var settings = await _db.Settings.FirstOrDefaultAsync(s => s.RecoveryKeyId == recoveryKeyId);
        if (settings is null)
        {
            settings = new Settings { RecoveryKeyId = recoveryKeyId };
            _db.Settings.Add(settings);
        }

        if (update.DarkMode.HasValue)
        {
            settings.DarkMode = update.DarkMode.Value;
        }

        if (update.Language is not null && SupportedLanguages.Contains(update.Language))
        {
            settings.Language = update.Language;
        }

        if (!string.IsNullOrWhiteSpace(update.Font) && update.Font.Length <= 100)
        {
            settings.Font = update.Font;
        }

        if (update.FontSize.HasValue)
        {
            settings.FontSize = Math.Clamp(update.FontSize.Value, 12, 32);
        }

        if (update.LineHeight.HasValue)
        {
            settings.LineHeight = Math.Clamp(update.LineHeight.Value, 1.2, 2.4);
        }

        if (update.LetterSpacing.HasValue)
        {
            settings.LetterSpacing = Math.Clamp(update.LetterSpacing.Value, 0.0, 0.3);
        }

        await _db.SaveChangesAsync();
        return settings;
    }
}
