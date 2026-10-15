using DualRead.Models;

namespace DualRead.Services.Interfaces;

public interface IAlbumService
{
    Task<List<Album>> GetAllAsync(Guid recoveryKeyId);

    Task<Album> CreateAsync(Guid recoveryKeyId, string name, string? description);

    Task<Album?> UpdateAsync(Guid recoveryKeyId, Guid albumId, string name, string? description);

    Task<bool> DeleteAsync(Guid recoveryKeyId, Guid albumId);

    Task<bool> RemoveBookAsync(Guid recoveryKeyId, Guid albumId, Guid bookId);

    Task<List<Guid>> GetAlbumIdsForBookAsync(Guid recoveryKeyId, Guid bookId);

    Task<bool> SetBookAlbumsAsync(Guid recoveryKeyId, Guid bookId, List<Guid> albumIds);
}
