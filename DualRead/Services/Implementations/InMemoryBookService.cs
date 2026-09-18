using DualRead.Models;
using DualRead.Services.Interfaces;

namespace DualRead.Services.Implementations;

public class InMemoryBookService : IBookService
{
    private static readonly string[] SupportedExtensions = { ".epub", ".pdf", ".docx" };

    private readonly List<Book> _books = new();
    private readonly object _lock = new();
    private readonly string _uploadsRoot;

    public InMemoryBookService(IWebHostEnvironment env)
    {
        _uploadsRoot = Path.Combine(env.ContentRootPath, "Uploads");
        Directory.CreateDirectory(_uploadsRoot);
    }

    public Task<List<Book>> GetLibraryAsync()
    {
        lock (_lock)
        {
            var snapshot = _books.OrderByDescending(b => b.UploadedAtUtc).ToList();
            return Task.FromResult(snapshot);
        }
    }

    public async Task<Book> UploadBookAsync(string originalFileName, long fileSizeBytes, Stream fileContent)
    {
        var extension = Path.GetExtension(originalFileName);
        if (!SupportedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Unsupported file type - only .epub, .pdf, and .docx are supported.");
        }

        var bookId = Guid.NewGuid();
        var storedFileName = $"{bookId}{extension}";
        var storedFilePath = Path.Combine(_uploadsRoot, storedFileName);

        await using (var destination = File.Create(storedFilePath))
        {
            await fileContent.CopyToAsync(destination);
        }

        var book = new Book
        {
            Id = bookId,
            Type = extension.ToLowerInvariant() switch
            {
                ".pdf" => BookType.Pdf,
                ".docx" => BookType.Docx,
                _ => BookType.Epub
            },
            Title = Path.GetFileNameWithoutExtension(originalFileName),
            Author = null,
            EpubFilePath = storedFilePath,
            CoverImagePath = null,
            FileSizeBytes = fileSizeBytes,
            UploadedAtUtc = DateTime.UtcNow
        };

        lock (_lock)
        {
            _books.Add(book);
        }

        return book;
    }

    public Task<Book?> RenameBookAsync(Guid bookId, string title, string? author)
    {
        lock (_lock)
        {
            var book = _books.FirstOrDefault(b => b.Id == bookId);
            if (book is null)
            {
                return Task.FromResult<Book?>(null);
            }

            book.Title = title.Trim();
            book.Author = string.IsNullOrWhiteSpace(author) ? null : author.Trim();

            return Task.FromResult<Book?>(book);
        }
    }

    public Task<bool> DeleteBookAsync(Guid bookId)
    {
        lock (_lock)
        {
            var book = _books.FirstOrDefault(b => b.Id == bookId);
            if (book is null)
            {
                return Task.FromResult(false);
            }

            _books.Remove(book);

            try
            {
                if (File.Exists(book.EpubFilePath))
                {
                    File.Delete(book.EpubFilePath);
                }
            }
            catch (IOException)
            {
            }

            return Task.FromResult(true);
        }
    }
}
