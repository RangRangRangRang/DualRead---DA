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
    public DbSet<RecoveryKey> RecoveryKeys => Set<RecoveryKey>();
    public DbSet<VocabularyItem> VocabularyItems => Set<VocabularyItem>();
    public DbSet<Translation> Translations => Set<Translation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<RecoveryKey>(entity =>
        {
            entity.HasIndex(rk => rk.Code).IsUnique();
        });

        modelBuilder.Entity<Book>(entity =>
        {
            entity.HasOne(b => b.RecoveryKey)
                  .WithMany(rk => rk.Books)
                  .HasForeignKey(b => b.RecoveryKeyId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(b => b.RecoveryKeyId);
        });

        modelBuilder.Entity<Chapter>(entity =>
        {
            entity.HasOne(c => c.Book)
                  .WithMany(b => b.Chapters)
                  .HasForeignKey(c => c.BookId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(c => new { c.BookId, c.Order });
        });

        modelBuilder.Entity<VocabularyItem>(entity =>
        {
            entity.HasOne(v => v.RecoveryKey)
                  .WithMany()
                  .HasForeignKey(v => v.RecoveryKeyId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(v => v.Book)
                  .WithMany()
                  .HasForeignKey(v => v.BookId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(v => v.RecoveryKeyId);
        });

        modelBuilder.Entity<Translation>(entity =>
        {
            entity.HasOne(t => t.Book)
                  .WithMany()
                  .HasForeignKey(t => t.BookId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(t => t.Chapter)
                  .WithMany()
                  .HasForeignKey(t => t.ChapterId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(t => new { t.ChapterId, t.ParagraphIndex }).IsUnique();
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
