using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DualRead.Models;

public class Chapter
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid BookId { get; set; }

    [ForeignKey(nameof(BookId))]
    public Book Book { get; set; } = null!;

    public int Order { get; set; }

    [Required]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string EpubItemHref { get; set; } = string.Empty;
}
