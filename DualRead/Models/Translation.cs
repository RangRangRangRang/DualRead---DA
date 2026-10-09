using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DualRead.Models;

public class Translation
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid BookId { get; set; }

    [ForeignKey(nameof(BookId))]
    public Book Book { get; set; } = null!;

    [Required]
    public Guid ChapterId { get; set; }

    [ForeignKey(nameof(ChapterId))]
    public Chapter Chapter { get; set; } = null!;

    public int ParagraphIndex { get; set; }

    public string TranslatedText { get; set; } = string.Empty;

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
