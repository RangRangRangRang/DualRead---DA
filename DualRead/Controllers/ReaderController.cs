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
    private readonly IPdfParsingService _pdfParsingService;
    private readonly IDocxParsingService _docxParsingService;
    private readonly IReadingProgressService _readingProgressService;
    private readonly IBookmarkService _bookmarkService;

    public ReaderController(
        IBookService bookService,
        IEpubParsingService epubParsingService,
        IPdfParsingService pdfParsingService,
        IDocxParsingService docxParsingService,
        IReadingProgressService readingProgressService,
        IBookmarkService bookmarkService)
    {
        _bookService = bookService;
        _epubParsingService = epubParsingService;
        _pdfParsingService = pdfParsingService;
        _docxParsingService = docxParsingService;
        _readingProgressService = readingProgressService;
        _bookmarkService = bookmarkService;
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

        var chapters = await _bookService.GetChaptersAsync(id);
        var progress = await _readingProgressService.GetByBookIdAsync(id);
        var bookmarks = await _bookmarkService.GetByBookIdAsync(id);

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
            }).ToList(),
            Bookmarks = bookmarks.Select(ToSummary).ToList()
        };

        var landingChapter = chapters.FirstOrDefault();
        if (progress?.CurrentChapterId is not null)
        {
            var savedChapter = chapters.FirstOrDefault(c => c.Id == progress.CurrentChapterId);
            if (savedChapter is not null)
            {
                landingChapter = savedChapter;
                bundle.LandingPage = progress.CurrentPage;
            }
        }

        if (landingChapter is not null)
        {
            bundle.LandingChapterId = landingChapter.Id;
            bundle.LandingChapterHtml = await LoadSanitizedChapterHtmlAsync(book, landingChapter);
        }

        return View(bundle);
    }

    [HttpGet("{id:guid}/Chapter/{chapterId:guid}")]
    public async Task<IActionResult> Chapter(Guid id, Guid chapterId)
    {
        var book = await _bookService.GetBookByIdAsync(id);
        if (book is null)
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

    [HttpPost("{id:guid}/Progress")]
    public async Task<IActionResult> SaveProgress(Guid id, [FromBody] SaveProgressDto dto)
    {
        var book = await _bookService.GetBookByIdAsync(id);
        if (book is null)
        {
            return NotFound();
        }

        await _readingProgressService.SaveAsync(id, dto.ChapterId, dto.Page);
        return Ok();
    }

    [HttpPost("{id:guid}/Bookmarks")]
    public async Task<IActionResult> AddBookmark(Guid id, [FromBody] CreateBookmarkDto dto)
    {
        var book = await _bookService.GetBookByIdAsync(id);
        if (book is null)
        {
            return NotFound();
        }

        var bookmark = await _bookmarkService.AddAsync(id, dto.ChapterId, dto.Page, dto.PreviewText);
        return Ok(ToSummary(bookmark));
    }

    [HttpDelete("{id:guid}/Bookmarks/{bookmarkId:guid}")]
    public async Task<IActionResult> DeleteBookmark(Guid id, Guid bookmarkId)
    {
        var deleted = await _bookmarkService.DeleteAsync(bookmarkId);
        if (!deleted)
        {
            return NotFound();
        }

        return Ok();
    }

    private static BookmarkSummary ToSummary(Bookmark bookmark)
    {
        return new BookmarkSummary
        {
            Id = bookmark.Id,
            ChapterId = bookmark.ChapterId,
            Page = bookmark.PageNumber,
            PreviewText = bookmark.PreviewText,
            CreatedAtUtc = bookmark.CreatedAtUtc
        };
    }

    private async Task<string> LoadSanitizedChapterHtmlAsync(Book book, Chapter chapter)
    {
        var rawHtml = book.Type switch
        {
            BookType.Epub => await _epubParsingService.GetChapterHtmlAsync(book.EpubFilePath, chapter.EpubItemHref),
            BookType.Pdf => await _pdfParsingService.GetChapterHtmlAsync(book.EpubFilePath, chapter.EpubItemHref),
            BookType.Docx => await _docxParsingService.GetChapterHtmlAsync(book.EpubFilePath, chapter.EpubItemHref),
            _ => string.Empty
        };

        if (book.Type == BookType.Pdf)
        {
            return rawHtml;
        }

        Func<string, string>? resolveAssetUrl = book.Type == BookType.Epub
            ? src => Url.Action("Asset", "Reader", new { id = book.Id, chapterId = chapter.Id, src })!
            : null;

        return ChapterHtmlSanitizer.ExtractAndSanitize(rawHtml, resolveAssetUrl);
    }
}
