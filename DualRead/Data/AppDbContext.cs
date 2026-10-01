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
    public DbSet<Bookmark> Bookmarks => Set<Bookmark>();
    public DbSet<ReadingProgress> ReadingProgresses => Set<ReadingProgress>();

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

        modelBuilder.Entity<Bookmark>(entity =>
        {
            entity.HasOne(b => b.Book)
                  .WithMany(bk => bk.Bookmarks)
                  .HasForeignKey(b => b.BookId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(b => b.Chapter)
                  .WithMany()
                  .HasForeignKey(b => b.ChapterId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(b => b.BookId);
        });

        modelBuilder.Entity<ReadingProgress>(entity =>
        {
            entity.HasKey(rp => rp.BookId);

            entity.HasOne(rp => rp.Book)
                  .WithOne(b => b.ReadingProgress)
                  .HasForeignKey<ReadingProgress>(rp => rp.BookId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
