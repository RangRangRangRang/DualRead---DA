using DualRead.Models;

namespace DualRead.ViewModels;

public class ReaderBundleViewModel
{
    public Guid BookId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Author { get; set; }
    public BookType BookType { get; set; }
    public List<ReaderChapterSummary> Chapters { get; set; } = new();
    public Guid? FirstChapterId { get; set; }
    public string FirstChapterHtml { get; set; } = string.Empty;
}

public class ReaderChapterSummary
{
    public Guid Id { get; set; }
    public int Order { get; set; }
    public string Title { get; set; } = string.Empty;
}
