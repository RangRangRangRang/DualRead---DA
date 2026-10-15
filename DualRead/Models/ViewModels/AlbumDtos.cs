namespace DualRead.ViewModels;

public class AlbumCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class AlbumUpdateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class SetBookAlbumsDto
{
    public List<Guid> AlbumIds { get; set; } = new();
}
