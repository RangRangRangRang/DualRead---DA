using DualRead.Models;
using DualRead.Services.Interfaces;

namespace DualRead.Services.Implementations;

public class CurrentRecoveryKeyAccessor : ICurrentRecoveryKeyAccessor
{
    public const string CookieName = "DualReadActiveKey";

    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IRecoveryKeyService _recoveryKeyService;

    public CurrentRecoveryKeyAccessor(IHttpContextAccessor httpContextAccessor, IRecoveryKeyService recoveryKeyService)
    {
        _httpContextAccessor = httpContextAccessor;
        _recoveryKeyService = recoveryKeyService;
    }

    public async Task<RecoveryKey?> GetCurrentAsync()
    {
        var context = _httpContextAccessor.HttpContext;
        if (context is null) return null;

        if (!context.Request.Cookies.TryGetValue(CookieName, out var raw) || !Guid.TryParse(raw, out var id))
        {
            return null;
        }

        return await _recoveryKeyService.GetByIdAsync(id);
    }

    public void SetActiveKeyCookie(Guid recoveryKeyId)
    {
        var context = _httpContextAccessor.HttpContext;
        if (context is null) return;

        context.Response.Cookies.Append(CookieName, recoveryKeyId.ToString(), new CookieOptions
        {
            HttpOnly = true,
            Secure = context.Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddYears(2),
            IsEssential = true
        });
    }

    public void ClearActiveKeyCookie()
    {
        _httpContextAccessor.HttpContext?.Response.Cookies.Delete(CookieName);
    }
}
