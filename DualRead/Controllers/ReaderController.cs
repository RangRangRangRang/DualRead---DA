using DualRead.Models;
using DualRead.Services;
using DualRead.Services.Interfaces;
using DualRead.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace DualRead.Controllers;

[Route("Reader")]
public class ReaderController : Controller
{
    private readonly IBookService _bookService;
    private readonly IEpubParsingService _epubParsingService;

    public ReaderController(IBookService bookService, IEpubParsingService epubParsingService)
    {
        _bookService = bookService;
        _epubParsingService = epubParsingService;
    }

    [HttpGet("{id:guid}")]
    [HttpGet("Index/{id:guid}")]
    public async Task<IActionResult> Index(Guid id)
    {
        var book = await _bookService.GetBookByIdAsync(id);
        if (book is null)
        {
            return NotFound();
        }

        if (book.Type != BookType.Epub)
        {
            TempData["ReaderUnsupported"] = $"\"{book.Title}\" is a {book.Type} - the Reader currently supports EPUB books only.";
            return RedirectToAction("Index", "Library");
        }

        var chapters = await _bookService.GetChaptersAsync(id);

        var bundle = new ReaderBundleViewModel
        {
            BookId = book.Id,
            Title = book.Title,
            Author = book.Author,
            BookType = book.Type,
            Chapters = chapters.Select(c => new ReaderChapterSummary
            {
                Id = c.Id,
                Order = c.Order,
                Title = c.Title
            }).ToList()
        };

        var firstChapter = chapters.FirstOrDefault();
        if (firstChapter is not null)
        {
            bundle.FirstChapterId = firstChapter.Id;
            bundle.FirstChapterHtml = await LoadSanitizedChapterHtmlAsync(book, firstChapter);
        }

        return View(bundle);
    }

    [HttpGet("{id:guid}/Chapter/{chapterId:guid}")]
    public async Task<IActionResult> Chapter(Guid id, Guid chapterId)
    {
        var book = await _bookService.GetBookByIdAsync(id);
        if (book is null || book.Type != BookType.Epub)
        {
            return NotFound();
        }

        var chapters = await _bookService.GetChaptersAsync(id);
        var chapter = chapters.FirstOrDefault(c => c.Id == chapterId);
        if (chapter is null)
        {
            return NotFound();
        }

        var html = await LoadSanitizedChapterHtmlAsync(book, chapter);
        return Json(new { title = chapter.Title, html });
    }

    [HttpGet("{id:guid}/Asset")]
    public async Task<IActionResult> Asset(Guid id, [FromQuery] Guid chapterId, [FromQuery] string src)
    {
        var book = await _bookService.GetBookByIdAsync(id);
        if (book is null || book.Type != BookType.Epub)
        {
            return NotFound();
        }

        var chapters = await _bookService.GetChaptersAsync(id);
        var chapter = chapters.FirstOrDefault(c => c.Id == chapterId);
        if (chapter is null)
        {
            return NotFound();
        }

        var asset = await _epubParsingService.GetAssetAsync(book.EpubFilePath, chapter.EpubItemHref, src);
        if (asset is null)
        {
            return NotFound();
        }

        return File(asset.Value.Bytes, asset.Value.ContentType);
    }

    private async Task<string> LoadSanitizedChapterHtmlAsync(Book book, Chapter chapter)
    {
        var rawHtml = await _epubParsingService.GetChapterHtmlAsync(book.EpubFilePath, chapter.EpubItemHref);
        return ChapterHtmlSanitizer.ExtractAndSanitize(
            rawHtml,
            src => Url.Action("Asset", "Reader", new { id = book.Id, chapterId = chapter.Id, src })!);
    }
}
