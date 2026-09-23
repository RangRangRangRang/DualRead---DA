using DualRead.Data;
using DualRead.Models;
using DualRead.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DualRead.Services.Implementations;

public class BookService : IBookService
{
    private static readonly string[] SupportedExtensions = { ".epub", ".pdf", ".docx" };

    private readonly AppDbContext _db;
    private readonly IEpubParsingService _epubParsingService;
    private readonly string _uploadsRoot;

    public BookService(AppDbContext db, IEpubParsingService epubParsingService, IWebHostEnvironment env)
    {
        _db = db;
        _epubParsingService = epubParsingService;
        _uploadsRoot = Path.Combine(env.ContentRootPath, "Uploads");
        Directory.CreateDirectory(_uploadsRoot);
    }

    public async Task<List<Book>> GetLibraryAsync()
    {
        return await _db.Books
            .OrderByDescending(b => b.UploadedAtUtc)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Book?> GetBookByIdAsync(Guid bookId)
    {
        return await _db.Books.AsNoTracking().FirstOrDefaultAsync(b => b.Id == bookId);
    }

    public async Task<List<Chapter>> GetChaptersAsync(Guid bookId)
    {
        return await _db.Chapters
            .Where(c => c.BookId == bookId)
            .OrderBy(c => c.Order)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Book> UploadBookAsync(string originalFileName, long fileSizeBytes, Stream fileContent)
    {
        var extension = Path.GetExtension(originalFileName);
        if (!SupportedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Unsupported file type - only .epub, .pdf, and .docx are supported.");
        }

        var bookId = Guid.NewGuid();
        var bookFolder = Path.Combine(_uploadsRoot, bookId.ToString());
        Directory.CreateDirectory(bookFolder);

        var sourceFilePath = Path.Combine(bookFolder, $"source{extension}");
        await using (var destination = File.Create(sourceFilePath))
        {
            await fileContent.CopyToAsync(destination);
        }

        var bookType = extension.ToLowerInvariant() switch
        {
            ".pdf" => BookType.Pdf,
            ".docx" => BookType.Docx,
            _ => BookType.Epub
        };

        var book = new Book
        {
            Id = bookId,
            Type = bookType,
            Title = Path.GetFileNameWithoutExtension(originalFileName),
            Author = null,
            EpubFilePath = sourceFilePath,
            CoverImagePath = null,
            FileSizeBytes = fileSizeBytes,
            UploadedAtUtc = DateTime.UtcNow
        };

        var chapters = new List<Chapter>();

        if (bookType == BookType.Epub)
        {
            try
            {
                var parsed = await _epubParsingService.ParseAsync(sourceFilePath);

                book.Title = string.IsNullOrWhiteSpace(parsed.Title) ? book.Title : parsed.Title;
                book.Author = parsed.Author;

                if (parsed.CoverImageBytes is { Length: > 0 })
                {
                    var coverExtension = string.IsNullOrWhiteSpace(parsed.CoverImageExtension) ? ".jpg" : parsed.CoverImageExtension;
                    var coverFilePath = Path.Combine(bookFolder, $"cover{coverExtension}");
                    await File.WriteAllBytesAsync(coverFilePath, parsed.CoverImageBytes);
                    book.CoverImagePath = $"/library-assets/{bookId}/cover{coverExtension}";
                }

                chapters = parsed.Chapters.Select(c => new Chapter
                {
                    BookId = bookId,
                    Order = c.Order,
                    Title = c.Title,
                    EpubItemHref = c.EpubItemHref
                }).ToList();
            }
            catch (Exception)
            {
                chapters = new List<Chapter>();
            }
        }

        _db.Books.Add(book);
        if (chapters.Count > 0)
        {
            _db.Chapters.AddRange(chapters);
        }
        await _db.SaveChangesAsync();

        return book;
    }

    public async Task<Book?> RenameBookAsync(Guid bookId, string title, string? author)
    {
        var book = await _db.Books.FirstOrDefaultAsync(b => b.Id == bookId);
        if (book is null)
        {
            return null;
        }

        book.Title = title.Trim();
        book.Author = string.IsNullOrWhiteSpace(author) ? null : author.Trim();

        await _db.SaveChangesAsync();

        return book;
    }

    public async Task<bool> DeleteBookAsync(Guid bookId)
    {
        var book = await _db.Books.FirstOrDefaultAsync(b => b.Id == bookId);
        if (book is null)
        {
            return false;
        }

        _db.Books.Remove(book);
        await _db.SaveChangesAsync();

        try
        {
            var bookFolder = Path.Combine(_uploadsRoot, bookId.ToString());
            if (Directory.Exists(bookFolder))
            {
                Directory.Delete(bookFolder, recursive: true);
            }
        }
        catch (IOException)
        {
        }

        return true;
    }
}
