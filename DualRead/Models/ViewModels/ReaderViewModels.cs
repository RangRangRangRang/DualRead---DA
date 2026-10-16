using DualRead.Models;

namespace DualRead.ViewModels;

public class ReaderBundleViewModel
{
    public Guid BookId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Author { get; set; }
    public BookType BookType { get; set; }
    public List<ReaderChapterSummary> Chapters { get; set; } = new();
    public Guid? LandingChapterId { get; set; }
    public int LandingPage { get; set; }
    public string LandingChapterHtml { get; set; } = string.Empty;
    public List<BookmarkSummary> Bookmarks { get; set; } = new();
    public bool CanTranslate { get; set; }
    public bool CanSaveSettings { get; set; }
    public SettingsViewModel Settings { get; set; } = new();
    public bool TranslationModeOn { get; set; }
}

public class ReaderChapterSummary
{
    public Guid Id { get; set; }
    public int Order { get; set; }
    public string Title { get; set; } = string.Empty;
}
