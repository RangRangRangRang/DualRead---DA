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

## Cập nhật Tuần 4 (PDF/DOCX, lưu tiến độ đọc, bookmark)

Tuần 4 thêm 2 bảng mới (`Bookmarks`, `ReadingProgresses`) và 3 package mới (PdfPig, Mammoth.Core, DocumentFormat.OpenXml). Sau khi copy code mới vào repo, chạy từ thư mục `DualRead` (nơi có `DualRead.csproj`):

```bash
dotnet restore
dotnet ef migrations add AddBookmarksAndReadingProgress
dotnet run
```

Migration mới sẽ tự áp dụng vào database khi `dotnet run`. Không sửa/xóa migration `InitialCreate` cũ.

Lưu ý: bookmark và tiến độ đọc hiện lưu theo sách và dùng chung cho mọi người xem (chưa có Recovery Key/tài khoản để tách riêng từng người).

## Cập nhật Tuần 5 (Recovery Key, Sổ từ vựng, Tra từ nhanh, Reader responsive)

Tuần 5 thêm 2 bảng mới (`RecoveryKeys`, `VocabularyItems`) và thêm cột bắt buộc `RecoveryKeyId` vào bảng `Books` đã có sẵn.

**Quan trọng - đọc trước khi chạy migration:** vì `Books.RecoveryKeyId` là cột bắt buộc (NOT NULL) nhưng các sách đã test từ Tuần 1-4 trong database hiện tại chưa có giá trị này, migration mới sẽ lỗi nếu database đang có sẵn dữ liệu cũ. Cách đơn giản nhất cho giai đoạn demo/test: xóa sạch database cũ rồi tạo lại từ đầu, vì dữ liệu test không cần giữ.

```bash
# Xóa database cũ trong pgAdmin (chuột phải > Delete/Drop), tạo lại database rỗng cùng tên

dotnet restore
dotnet ef migrations add AddRecoveryKeyAndVocabulary
dotnet run
```

Nếu muốn giữ lại dữ liệu test cũ thay vì xóa, phải tự sửa migration để gán một RecoveryKey mặc định cho các sách cũ - không khuyến khích ở giai đoạn này vì mất thời gian không cần thiết.

Sau khi chạy lại, flow mới sẽ là: upload sách lần đầu tự động tạo Recovery Key mới (hiện banner xanh ở trang Gateway để lưu lại) → vào Thư viện sẽ thấy đúng sách của Recovery Key đó, không thấy sách của người khác → quay lại dùng key cũ bằng cách nhập vào ô "Nhập Recovery Key..." ở trang Gateway.

## Cập nhật Tuần 6 (Chế độ Dịch)

Tuần 6 thêm bảng `Translations` và cột `TranslationModeOn` vào bảng `ReadingProgresses`. Cả hai đều không gây xung đột với dữ liệu cũ (bảng mới, cột bool tự có giá trị mặc định false), nên không cần xóa database.

```bash
dotnet ef migrations add AddTranslations
dotnet run
```

Cách dùng: mở một sách của chính thư viện mình (đang dùng đúng Recovery Key), bấm nút "Dịch" ở thanh trên hoặc nhấn phím T. Mỗi đoạn văn hiện cạnh một ô nhập, gõ bản dịch là tự lưu sau khoảng 0,8 giây. Nút "Xuất bản dịch" tải file .docx gồm các đoạn đã dịch theo từng chương. Bôi đen chữ ở cột nguyên văn vẫn dùng được Dịch nhanh.

Giới hạn đã biết: ở chế độ Dịch, cột nguyên văn chỉ hiện các đoạn chữ và tiêu đề (ảnh trong chương bị ẩn), nội dung cuộn dọc thay vì lật trang, và bookmark bị tắt cho tới khi quay lại chế độ đọc.

## Cập nhật Tuần 7 (Album, Đọc to, EN/VI, lưu cài đặt, triển khai)

Tuần 7 thêm 3 bảng mới: `Albums`, `AlbumBooks`, `Settings`. Đều là bảng mới nên không cần xóa database.

```bash
dotnet ef migrations add AddAlbumsAndSettings
dotnet run
```

Cách dùng:
- **Album:** trong Thư viện có tab "Album". Bấm nút "Album" trên một thẻ sách để chọn sách thuộc album nào (có thể tạo album mới ngay trong cửa sổ đó). Xóa album không xóa sách bên trong.
- **Đọc to:** trong Reader bấm nút "Âm thanh" hoặc nhấn phím **A**. Đọc từng đoạn, có tạm dừng, đoạn trước/sau, tốc độ 0.75x-2x; đọc hết chương sẽ tự sang chương sau. Chọn giọng đọc ở thanh cài đặt bên phải. Tốc độ và giọng đọc lưu trên trình duyệt (localStorage), không đồng bộ qua Recovery Key. Trình duyệt không hỗ trợ giọng nói thì nút tự ẩn.
- **Đổi ngôn ngữ EN/VI:** nút EN | VI ở đầu Thư viện hoặc ô Language ở cài đặt Reader. Chỉ đổi chữ giao diện (nhãn, tooltip, thông báo), không đổi nội dung sách.
- **Lưu cài đặt Reader:** chế độ tối, phông chữ, cỡ chữ, giãn dòng, khoảng cách chữ, ngôn ngữ được lưu theo Recovery Key và tự khôi phục khi mở lại.

### Triển khai lên Render (miễn phí)

1. Đảm bảo thư mục `Migrations/` đã được commit, và `.gitignore` có dòng `Uploads/`.
2. Đẩy repo lên GitHub (file `render.yaml` nằm ở thư mục gốc repo, cùng cấp với `DualRead.sln`).
3. Trên Render chọn New > Blueprint, trỏ vào repo. Render tự tạo web service (Docker) và database PostgreSQL theo `render.yaml`.
4. `Program.cs` tự nhận biến `DATABASE_URL` và `PORT`, không cần sửa code. Khi khởi động, `MigrateAsync()` tự tạo bảng.

Giới hạn cần ghi trong báo cáo: thư mục `Uploads/` nằm trên ổ đĩa tạm của Render, nên sách đã tải lên sẽ mất sau mỗi lần deploy hoặc khởi động lại (bản ghi trong database vẫn còn nhưng file thì không). Web service và database gói miễn phí có giới hạn của Render (ngủ khi không dùng, database có thời hạn), hãy kiểm tra điều khoản hiện hành trước khi demo.
