using System.Security.Cryptography;
using DualRead.Data;
using DualRead.Models;
using DualRead.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DualRead.Services.Implementations;

public class RecoveryKeyService : IRecoveryKeyService
{
    private const string CharSet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private const int GroupCount = 3;
    private const int GroupLength = 4;

    private readonly AppDbContext _db;

    public RecoveryKeyService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<RecoveryKey> GenerateNewKeyAsync()
    {
        string code;
        do
        {
            code = GenerateCode();
        } while (await _db.RecoveryKeys.AnyAsync(rk => rk.Code == code));

        var recoveryKey = new RecoveryKey
        {
            Id = Guid.NewGuid(),
            Code = code,
            CreatedAtUtc = DateTime.UtcNow,
            LastAccessedAtUtc = DateTime.UtcNow
        };

        _db.RecoveryKeys.Add(recoveryKey);
        await _db.SaveChangesAsync();

        return recoveryKey;
    }

    public async Task<RecoveryKey?> ValidateAsync(string code)
    {
        if (string.IsNullOrWhiteSpace(code)) return null;

        var key = await _db.RecoveryKeys.FirstOrDefaultAsync(rk => rk.Code == code.Trim().ToUpperInvariant());
        if (key is null) return null;

        key.LastAccessedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return key;
    }

    public async Task<RecoveryKey?> GetByIdAsync(Guid id)
    {
        return await _db.RecoveryKeys.AsNoTracking().FirstOrDefaultAsync(rk => rk.Id == id);
    }

    private static string GenerateCode()
    {
        var groups = new string[GroupCount];
        for (var g = 0; g < GroupCount; g++)
        {
            var chars = new char[GroupLength];
            for (var i = 0; i < GroupLength; i++)
            {
                chars[i] = CharSet[RandomNumberGenerator.GetInt32(CharSet.Length)];
            }
            groups[g] = new string(chars);
        }
        return string.Join('-', groups);
    }
}
