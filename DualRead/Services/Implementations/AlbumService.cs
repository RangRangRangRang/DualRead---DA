using DualRead.Data;
using DualRead.Models;
using DualRead.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DualRead.Services.Implementations;

public class AlbumService : IAlbumService
{
    private readonly AppDbContext _db;

    public AlbumService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<Album>> GetAllAsync(Guid recoveryKeyId)
    {
        return await _db.Albums
            .Where(a => a.RecoveryKeyId == recoveryKeyId)
            .Include(a => a.AlbumBooks)
            .ThenInclude(ab => ab.Book)
            .OrderByDescending(a => a.UpdatedAtUtc)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Album> CreateAsync(Guid recoveryKeyId, string name, string? description)
    {
        var album = new Album
        {
            RecoveryKeyId = recoveryKeyId,
            Name = name.Trim(),
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _db.Albums.Add(album);
        await _db.SaveChangesAsync();

        return album;
    }

    public async Task<Album?> UpdateAsync(Guid recoveryKeyId, Guid albumId, string name, string? description)
    {
        var album = await _db.Albums.FirstOrDefaultAsync(a => a.Id == albumId && a.RecoveryKeyId == recoveryKeyId);
        if (album is null)
        {
            return null;
        }

        album.Name = name.Trim();
        album.Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        album.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return album;
    }

    public async Task<bool> DeleteAsync(Guid recoveryKeyId, Guid albumId)
    {
        var album = await _db.Albums.FirstOrDefaultAsync(a => a.Id == albumId && a.RecoveryKeyId == recoveryKeyId);
        if (album is null)
        {
            return false;
        }

        _db.Albums.Remove(album);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveBookAsync(Guid recoveryKeyId, Guid albumId, Guid bookId)
    {
        var membership = await _db.AlbumBooks
            .Include(ab => ab.Album)
            .FirstOrDefaultAsync(ab => ab.AlbumId == albumId && ab.BookId == bookId && ab.Album.RecoveryKeyId == recoveryKeyId);
        if (membership is null)
        {
            return false;
        }

        _db.AlbumBooks.Remove(membership);
        membership.Album.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<Guid>> GetAlbumIdsForBookAsync(Guid recoveryKeyId, Guid bookId)
    {
        return await _db.AlbumBooks
            .Where(ab => ab.BookId == bookId && ab.Album.RecoveryKeyId == recoveryKeyId)
            .Select(ab => ab.AlbumId)
            .ToListAsync();
    }

    public async Task<bool> SetBookAlbumsAsync(Guid recoveryKeyId, Guid bookId, List<Guid> albumIds)
    {
        var ownsBook = await _db.Books.AnyAsync(b => b.Id == bookId && b.RecoveryKeyId == recoveryKeyId);
        if (!ownsBook)
        {
            return false;
        }

        var ownedAlbums = await _db.Albums
            .Where(a => a.RecoveryKeyId == recoveryKeyId)
            .Include(a => a.AlbumBooks)
            .ToListAsync();

        var wanted = new HashSet<Guid>(albumIds);

        foreach (var album in ownedAlbums)
        {
            var existing = album.AlbumBooks.FirstOrDefault(ab => ab.BookId == bookId);
            var shouldContain = wanted.Contains(album.Id);

            if (shouldContain && existing is null)
            {
                var nextOrder = album.AlbumBooks.Count == 0 ? 0 : album.AlbumBooks.Max(ab => ab.Order) + 1;
                _db.AlbumBooks.Add(new AlbumBook
                {
                    AlbumId = album.Id,
                    BookId = bookId,
                    AddedAtUtc = DateTime.UtcNow,
                    Order = nextOrder
                });
                album.UpdatedAtUtc = DateTime.UtcNow;
            }
            else if (!shouldContain && existing is not null)
            {
                _db.AlbumBooks.Remove(existing);
                album.UpdatedAtUtc = DateTime.UtcNow;
            }
        }

        await _db.SaveChangesAsync();
        return true;
    }
}
