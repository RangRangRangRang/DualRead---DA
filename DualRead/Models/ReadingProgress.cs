using System.ComponentModel.DataAnnotations.Schema;

namespace DualRead.Models;

public class ReadingProgress
{
    [ForeignKey(nameof(Book))]
    public Guid BookId { get; set; }

    public Book Book { get; set; } = null!;

    public Guid? CurrentChapterId { get; set; }

    public int CurrentPage { get; set; }

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
