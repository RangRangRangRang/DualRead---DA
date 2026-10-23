using DualRead.Models;

namespace DualRead.ViewModels;

public class LibraryViewModel
{
    public List<Book> Books { get; set; } = new();

    public HashSet<Guid> StartedBookIds { get; set; } = new();

    public int TotalCount => Books.Count;
}
