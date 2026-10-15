using DualRead.Models;
using DualRead.Services.Interfaces;
using DualRead.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace DualRead.Controllers;

[ApiController]
public class AlbumController : ControllerBase
{
    private readonly IAlbumService _albumService;
    private readonly ICurrentRecoveryKeyAccessor _currentRecoveryKeyAccessor;

    public AlbumController(IAlbumService albumService, ICurrentRecoveryKeyAccessor currentRecoveryKeyAccessor)
    {
        _albumService = albumService;
        _currentRecoveryKeyAccessor = currentRecoveryKeyAccessor;
    }

    [HttpGet("api/albums")]
    public async Task<IActionResult> GetAll()
    {
        var recoveryKey = await _currentRecoveryKeyAccessor.GetCurrentAsync();
        if (recoveryKey is null) return Unauthorized();

        var albums = await _albumService.GetAllAsync(recoveryKey.Id);
        return Ok(albums.Select(ToResponse).ToList());
    }

    [HttpPost("api/albums")]
    public async Task<IActionResult> Create([FromBody] AlbumCreateDto? dto)
    {
        if (dto is null || string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new { error = "Album name is required." });
        }

        var recoveryKey = await _currentRecoveryKeyAccessor.GetCurrentAsync();
        if (recoveryKey is null) return Unauthorized();

        var album = await _albumService.CreateAsync(recoveryKey.Id, dto.Name, dto.Description);
        return Ok(ToResponse(album));
    }

    [HttpPut("api/albums/{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] AlbumUpdateDto? dto)
    {
        if (dto is null || string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new { error = "Album name is required." });
        }

        var recoveryKey = await _currentRecoveryKeyAccessor.GetCurrentAsync();
        if (recoveryKey is null) return Unauthorized();

        var album = await _albumService.UpdateAsync(recoveryKey.Id, id, dto.Name, dto.Description);
        if (album is null) return NotFound();

        return Ok(ToResponse(album));
    }

    [HttpDelete("api/albums/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var recoveryKey = await _currentRecoveryKeyAccessor.GetCurrentAsync();
        if (recoveryKey is null) return Unauthorized();

        var deleted = await _albumService.DeleteAsync(recoveryKey.Id, id);
        if (!deleted) return NotFound();

        return NoContent();
    }

    [HttpDelete("api/albums/{id:guid}/books/{bookId:guid}")]
    public async Task<IActionResult> RemoveBook(Guid id, Guid bookId)
    {
        var recoveryKey = await _currentRecoveryKeyAccessor.GetCurrentAsync();
        if (recoveryKey is null) return Unauthorized();

        var removed = await _albumService.RemoveBookAsync(recoveryKey.Id, id, bookId);
        if (!removed) return NotFound();

        return NoContent();
    }

    [HttpGet("api/albums/book/{bookId:guid}")]
    public async Task<IActionResult> GetAlbumsForBook(Guid bookId)
    {
        var recoveryKey = await _currentRecoveryKeyAccessor.GetCurrentAsync();
        if (recoveryKey is null) return Unauthorized();

        var albumIds = await _albumService.GetAlbumIdsForBookAsync(recoveryKey.Id, bookId);
        return Ok(albumIds);
    }

    [HttpPost("api/albums/book/{bookId:guid}")]
    public async Task<IActionResult> SetBookAlbums(Guid bookId, [FromBody] SetBookAlbumsDto? dto)
    {
        var recoveryKey = await _currentRecoveryKeyAccessor.GetCurrentAsync();
        if (recoveryKey is null) return Unauthorized();

        var ok = await _albumService.SetBookAlbumsAsync(recoveryKey.Id, bookId, dto?.AlbumIds ?? new List<Guid>());
        if (!ok) return NotFound();

        return Ok(new { success = true });
    }

    private static object ToResponse(Album album)
    {
        var books = album.AlbumBooks
            .OrderBy(ab => ab.Order)
            .ThenByDescending(ab => ab.AddedAtUtc)
            .Select(ab => new
            {
                id = ab.Book.Id,
                title = ab.Book.Title,
                author = ab.Book.Author,
                type = ab.Book.Type.ToString(),
                coverImagePath = ab.Book.CoverImagePath,
                addedAtUtc = ab.AddedAtUtc
            })
            .ToList();

        return new
        {
            id = album.Id,
            name = album.Name,
            description = album.Description,
            createdAtUtc = album.CreatedAtUtc,
            updatedAtUtc = album.UpdatedAtUtc,
            bookCount = books.Count,
            books
        };
    }
}
