using DualRead.Models;
using DualRead.Services.Interfaces;
using DualRead.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace DualRead.Controllers;

[ApiController]
[Route("api/vocabulary")]
public class VocabularyController : ControllerBase
{
    private readonly IVocabularyService _vocabularyService;
    private readonly ICurrentRecoveryKeyAccessor _currentRecoveryKeyAccessor;

    public VocabularyController(IVocabularyService vocabularyService, ICurrentRecoveryKeyAccessor currentRecoveryKeyAccessor)
    {
        _vocabularyService = vocabularyService;
        _currentRecoveryKeyAccessor = currentRecoveryKeyAccessor;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var recoveryKey = await _currentRecoveryKeyAccessor.GetCurrentAsync();
        if (recoveryKey is null) return Unauthorized();

        var list = await _vocabularyService.GetAllByRecoveryKeyAsync(recoveryKey.Id);
        return Ok(list);
    }

    [HttpGet("book/{bookId:guid}")]
    public async Task<IActionResult> GetByBook(Guid bookId)
    {
        var recoveryKey = await _currentRecoveryKeyAccessor.GetCurrentAsync();
        if (recoveryKey is null) return Unauthorized();

        var list = await _vocabularyService.GetByBookIdAsync(recoveryKey.Id, bookId);
        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] VocabularyCreateDto? dto)
    {
        if (dto is null || string.IsNullOrWhiteSpace(dto.OriginalText) || string.IsNullOrWhiteSpace(dto.TranslatedText))
        {
            return BadRequest(new { error = "Original text and translation are required." });
        }

        var recoveryKey = await _currentRecoveryKeyAccessor.GetCurrentAsync();
        if (recoveryKey is null) return Unauthorized();

        var item = new VocabularyItem
        {
            RecoveryKeyId = recoveryKey.Id,
            BookId = dto.BookId,
            BookTitle = dto.BookTitle?.Trim(),
            ChapterId = dto.ChapterId,
            ChapterTitle = dto.ChapterTitle?.Trim(),
            OriginalText = dto.OriginalText.Trim(),
            TranslatedText = dto.TranslatedText.Trim(),
            ContextText = dto.ContextText?.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };

        var saved = await _vocabularyService.AddAsync(item);
        return Ok(saved);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var recoveryKey = await _currentRecoveryKeyAccessor.GetCurrentAsync();
        if (recoveryKey is null) return Unauthorized();

        var deleted = await _vocabularyService.DeleteAsync(recoveryKey.Id, id);
        if (!deleted) return NotFound();

        return NoContent();
    }
}
