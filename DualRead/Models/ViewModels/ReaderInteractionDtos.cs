namespace DualRead.ViewModels;

public class SaveProgressDto
{
    public Guid? ChapterId { get; set; }
    public int Page { get; set; }
}

public class CreateBookmarkDto
{
    public Guid? ChapterId { get; set; }
    public int Page { get; set; }
    public string? PreviewText { get; set; }
}

public class BookmarkSummary
{
    public Guid Id { get; set; }
    public Guid? ChapterId { get; set; }
    public int Page { get; set; }
    public string? PreviewText { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
