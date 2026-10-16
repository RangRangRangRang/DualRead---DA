using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DualRead.Models;

public class Settings
{
    [Key]
    [ForeignKey(nameof(RecoveryKey))]
    public Guid RecoveryKeyId { get; set; }

    public RecoveryKey RecoveryKey { get; set; } = null!;

    public bool DarkMode { get; set; } = true;

    [MaxLength(20)]
    public string Language { get; set; } = "en";

    [MaxLength(100)]
    public string Font { get; set; } = "'Times New Roman', Times, serif";

    public int FontSize { get; set; } = 18;

    public double LineHeight { get; set; } = 1.75;

    public double LetterSpacing { get; set; }
}
