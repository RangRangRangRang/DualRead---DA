namespace DualRead.Services.Interfaces;

public interface ITranslationExportService
{
    Task<(byte[] Bytes, string FileName)?> ExportTranslationToDocxAsync(Guid bookId, Guid recoveryKeyId);
}
