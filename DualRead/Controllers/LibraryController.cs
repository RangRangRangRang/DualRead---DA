using DualRead.Services.Interfaces;
using DualRead.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace DualRead.Controllers;

public class LibraryController : Controller
{
    private const long MaxUploadBytes = 200 * 1024 * 1024;
    private static readonly string[] SupportedExtensions = { ".epub", ".pdf", ".docx" };

    private readonly IBookService _bookService;

    public LibraryController(IBookService bookService)
    {
        _bookService = bookService;
    }

    [HttpGet]
    public async Task<IActionResult> Index()
    {
        var books = await _bookService.GetLibraryAsync();
        var viewModel = new LibraryViewModel { Books = books };
        return View(viewModel);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [RequestSizeLimit(MaxUploadBytes * 20)]
    public async Task<IActionResult> Upload(List<IFormFile> epubFiles)
    {
        if (epubFiles is null || epubFiles.Count == 0 || epubFiles.All(f => f.Length == 0))
        {
            TempData["UploadErrors"] = "Choose at least one .epub, .pdf, or .docx file to upload.";
            return RedirectToAction("Index", "Home");
        }

        var succeeded = new List<string>();
        var failed = new List<string>();
        var seenInBatch = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var file in epubFiles)
        {
            if (file is null || file.Length == 0) continue;

            var dedupeKey = $"{file.FileName}::{file.Length}";
            if (!seenInBatch.Add(dedupeKey))
            {
                failed.Add($"{file.FileName}: Duplicate file in this upload batch - skipped.");
                continue;
            }

            var extension = Path.GetExtension(file.FileName);
            if (!SupportedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
            {
                failed.Add($"{file.FileName}: Unsupported file type - only .epub, .pdf, and .docx are supported.");
                continue;
            }

            if (file.Length > MaxUploadBytes)
            {
                failed.Add($"{file.FileName}: File is too large (200 MB max).");
                continue;
            }

            try
            {
                await using var stream = file.OpenReadStream();
                await _bookService.UploadBookAsync(file.FileName, file.Length, stream);
                succeeded.Add(file.FileName);
            }
            catch (Exception ex)
            {
                failed.Add($"{file.FileName}: {ex.Message}");
            }
        }

        if (succeeded.Count > 0)
        {
            TempData["UploadSuccessCount"] = succeeded.Count;
            TempData["UploadSuccessFiles"] = string.Join("|", succeeded);
        }

        if (failed.Count > 0)
        {
            TempData["UploadErrors"] = string.Join("|", failed);
        }

        return RedirectToAction("Index", "Library");
    }

    [HttpPut("api/books/{id:guid}/rename")]
    public async Task<IActionResult> RenameBook(Guid id, [FromBody] BookRenameDto? dto)
    {
        if (dto is null || string.IsNullOrWhiteSpace(dto.Title))
        {
            return BadRequest(new { error = "Book title is required." });
        }

        var book = await _bookService.RenameBookAsync(id, dto.Title, dto.Author);
        if (book is null)
        {
            return NotFound();
        }

        return Ok(new { id = book.Id, title = book.Title, author = book.Author });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _bookService.DeleteBookAsync(id);
        return RedirectToAction("Index", "Library");
    }
}
