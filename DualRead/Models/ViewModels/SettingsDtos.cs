using DualRead.Models;

namespace DualRead.ViewModels;

public class SettingsViewModel
{
    public bool DarkMode { get; set; } = true;
    public string Language { get; set; } = "en";
    public string Font { get; set; } = "'Times New Roman', Times, serif";
    public int FontSize { get; set; } = 18;
    public double LineHeight { get; set; } = 1.75;
    public double LetterSpacing { get; set; }

    public static SettingsViewModel From(Settings settings)
    {
        return new SettingsViewModel
        {
            DarkMode = settings.DarkMode,
            Language = settings.Language,
            Font = settings.Font,
            FontSize = settings.FontSize,
            LineHeight = settings.LineHeight,
            LetterSpacing = settings.LetterSpacing
        };
    }
}

public class SettingsUpdateDto
{
    public bool? DarkMode { get; set; }
    public string? Language { get; set; }
    public string? Font { get; set; }
    public int? FontSize { get; set; }
    public double? LineHeight { get; set; }
    public double? LetterSpacing { get; set; }
}
