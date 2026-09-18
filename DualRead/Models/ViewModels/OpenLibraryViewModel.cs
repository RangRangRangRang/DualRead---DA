using System.ComponentModel.DataAnnotations;

namespace DualRead.ViewModels;

public class OpenLibraryViewModel
{
    [Required(ErrorMessage = "Enter your recovery key.")]
    [Display(Name = "Recovery Key")]
    public string RecoveryKeyCode { get; set; } = string.Empty;

    public string? ErrorMessage { get; set; }
}
