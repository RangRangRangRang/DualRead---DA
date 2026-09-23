# Chạy project lần đầu

Yêu cầu: đã cài .NET 8 SDK và PostgreSQL (chạy local hoặc dùng Docker).

## 1. Cấu hình connection string

Mở `appsettings.json`, sửa `ConnectionStrings:DefaultConnection` cho khớp với PostgreSQL của bạn (Host/Port/Database/Username/Password). Giá trị mặc định giả định PostgreSQL chạy trên `localhost:5432`, database tên `dualread`, user `postgres` mật khẩu `postgres`.

Nếu chưa có database, tạo trước bằng lệnh SQL:

```sql
CREATE DATABASE dualread;
```

## 2. Tạo migration lần đầu (chỉ cần chạy 1 lần)

Từ thư mục `DualRead` (nơi có file `DualRead.csproj`):

```bash
dotnet tool install --global dotnet-ef
dotnet ef migrations add InitialCreate
```

Lệnh này tạo ra thư mục `Migrations/` chứa file mô tả schema (bảng `Books`, `Chapters`). Chỉ cần chạy lại `dotnet ef migrations add <TênMigration>` khi sau này bạn đổi cấu trúc Model (thêm bảng, thêm cột...).

## 3. Chạy project

```bash
dotnet run
```

`Program.cs` đã tự động gọi `db.Database.MigrateAsync()` khi khởi động, nên migration ở bước 2 sẽ tự áp dụng vào database - không cần chạy `dotnet ef database update` riêng.

## 4. Test nhanh

- Mở trình duyệt vào URL mà `dotnet run` in ra (thường là `https://localhost:5001` hoặc tương tự).
- Upload thử 1 file `.epub` bất kỳ (không có DRM) - hệ thống sẽ tự trích tiêu đề, tác giả, ảnh bìa, và chia chương.
- Vào Thư viện, bấm "Đọc" trên sách vừa upload để mở Reader.
- File `.pdf`/`.docx` vẫn upload/hiển thị được trong Thư viện, nhưng nút "Đọc" sẽ báo "coming soon" - parsing PDF/DOCX chưa nằm trong milestone này.

## Lưu ý khi deploy lên Render/Supabase/Neon

`Program.cs` tự nhận biến môi trường `DATABASE_URL` (định dạng `postgres://user:pass@host:port/dbname`) và biến `PORT`, không cần sửa code khi deploy - chỉ cần set 2 biến môi trường đó trên nền tảng hosting.
