using DualRead.Models;
using Microsoft.EntityFrameworkCore;

namespace DualRead.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Book> Books => Set<Book>();
    public DbSet<Chapter> Chapters => Set<Chapter>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Chapter>(entity =>
        {
            entity.HasOne(c => c.Book)
                  .WithMany(b => b.Chapters)
                  .HasForeignKey(c => c.BookId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(c => new { c.BookId, c.Order });
        });
    }
}
