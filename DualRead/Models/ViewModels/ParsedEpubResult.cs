namespace DualRead.ViewModels;

public class ParsedEpubResult
{
    public string Title { get; set; } = "Untitled";
    public string? Author { get; set; }
    public byte[]? CoverImageBytes { get; set; }
    public string? CoverImageExtension { get; set; }
    public List<ParsedChapter> Chapters { get; set; } = new();
}

public class ParsedChapter
{
    public int Order { get; set; }
    public string Title { get; set; } = string.Empty;
    public string EpubItemHref { get; set; } = string.Empty;
}
