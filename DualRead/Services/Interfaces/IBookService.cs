using DualRead.Models;

namespace DualRead.Services.Interfaces;

public interface IBookService
{
    Task<List<Book>> GetLibraryAsync();

    Task<Book> UploadBookAsync(string originalFileName, long fileSizeBytes, Stream fileContent);

    Task<Book?> RenameBookAsync(Guid bookId, string title, string? author);

    Task<bool> DeleteBookAsync(Guid bookId);
}
