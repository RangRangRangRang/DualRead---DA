using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DualRead.Models;

public class VocabularyItem
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid RecoveryKeyId { get; set; }

    [ForeignKey(nameof(RecoveryKeyId))]
    public RecoveryKey? RecoveryKey { get; set; }

    public Guid? BookId { get; set; }

    [ForeignKey(nameof(BookId))]
    public Book? Book { get; set; }

    [MaxLength(255)]
    public string? BookTitle { get; set; }

    public Guid? ChapterId { get; set; }

    [MaxLength(255)]
    public string? ChapterTitle { get; set; }

    [Required]
    public string OriginalText { get; set; } = string.Empty;

    [Required]
    public string TranslatedText { get; set; } = string.Empty;

    public string? ContextText { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
