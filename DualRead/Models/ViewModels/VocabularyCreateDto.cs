namespace DualRead.ViewModels;

public class VocabularyCreateDto
{
    public Guid? BookId { get; set; }
    public string? BookTitle { get; set; }
    public Guid? ChapterId { get; set; }
    public string? ChapterTitle { get; set; }
    public string OriginalText { get; set; } = string.Empty;
    public string TranslatedText { get; set; } = string.Empty;
    public string? ContextText { get; set; }
}
