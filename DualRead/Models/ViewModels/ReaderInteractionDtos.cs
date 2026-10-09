namespace DualRead.ViewModels;

public class SaveProgressDto
{
    public Guid? ChapterId { get; set; }
    public int Page { get; set; }
    public bool TranslationModeOn { get; set; }
}

public class TranslationSaveDto
{
    public int ParagraphIndex { get; set; }
    public string TranslatedText { get; set; } = string.Empty;
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
