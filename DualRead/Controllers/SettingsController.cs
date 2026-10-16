using DualRead.Services.Interfaces;
using DualRead.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace DualRead.Controllers;

[ApiController]
[Route("api/settings")]
public class SettingsController : ControllerBase
{
    private readonly ISettingsService _settingsService;
    private readonly ICurrentRecoveryKeyAccessor _currentRecoveryKeyAccessor;

    public SettingsController(ISettingsService settingsService, ICurrentRecoveryKeyAccessor currentRecoveryKeyAccessor)
    {
        _settingsService = settingsService;
        _currentRecoveryKeyAccessor = currentRecoveryKeyAccessor;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var recoveryKey = await _currentRecoveryKeyAccessor.GetCurrentAsync();
        if (recoveryKey is null) return Unauthorized();

        var settings = await _settingsService.GetAsync(recoveryKey.Id);
        return Ok(SettingsViewModel.From(settings));
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] SettingsUpdateDto? dto)
    {
        if (dto is null) return BadRequest();

        var recoveryKey = await _currentRecoveryKeyAccessor.GetCurrentAsync();
        if (recoveryKey is null) return Unauthorized();

        var settings = await _settingsService.SaveAsync(recoveryKey.Id, dto);
        return Ok(SettingsViewModel.From(settings));
    }
}
