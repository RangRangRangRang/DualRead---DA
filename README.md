# DualRead

Ứng dụng web thư viện cá nhân để tải sách lên, đọc và tự dịch song song với bản gốc. Ứng dụng có thêm sổ từ vựng cá nhân và đọc nội dung sách ngay trên trình duyệt.

> Đọc trước, dịch khi cần. Chế độ dịch luôn do người dùng chủ động bật, không bao giờ bị ép.

## Nhóm thực hiện

**Nhóm 1**, lớp -1-1-26(N01), môn Đồ án cơ sở Công nghệ Thông tin.
Giảng viên hướng dẫn: **TS. Trần Đình Tân**.

| STT | Họ và tên | Mã sinh viên | Lớp | Vai trò |
|---|---|---|---|---|
| 1 | Lê Trường Giang | 23010721 | K17-CNTT_8 |
| 2 | Trần Ngọc Bảo | 23010759 | K17-CNTT_8 |
| 3 | Phạm Ngọc Đức | 23010074 | K17-CNTT_1 |

## Tính năng

**Thư viện**
- Tải lên nhiều file cùng lúc bằng cách kéo thả, hỗ trợ `.epub`, `.pdf`, `.docx`.
- Lưới thẻ sách hoặc dạng danh sách, nhóm theo định dạng, tìm kiếm không phân biệt hoa thường và dấu, sắp xếp theo ngày, tên, tác giả.
- Hiển thị trạng thái "Đang đọc" hoặc "Chưa đọc" cho từng cuốn.
- Album: gom sách thành các bộ sưu tập (hiển thị dạng kệ sách), thêm hoặc gỡ sách, xóa album không làm mất sách.
- Đổi tên và xóa sách. Xóa sách sẽ xóa cả file, ảnh bìa, bookmark, tiến độ và bản dịch của sách đó.

**Không cần tài khoản: Recovery Key**
- Lần tải sách đầu tiên tự sinh một mã dạng `K8AF-HX32-JM9Q`. Toàn bộ sách, album, từ vựng và cài đặt thuộc về mã này.
- Nhập lại mã ở trang đầu để mở lại thư viện trên trình duyệt hoặc thiết bị khác.

**Đọc sách**
- Cuộn dọc liền mạch: `Space` hoặc `↑` `↓` để cuộn, `←` `→` để chuyển chương, hiển thị phần trăm đã đọc.
- Tự lưu và khôi phục vị trí đọc, bookmark theo từng vị trí trong chương.
- Tùy chỉnh chế độ tối, phông chữ, cỡ chữ, giãn dòng, khoảng cách chữ, lưu theo Recovery Key.
- File PDF được mở nguyên bản bằng trình xem PDF của trình duyệt.

**Dịch và học từ**
- Chế độ Dịch (EPUB, DOCX): mỗi đoạn nguyên văn đi kèm một ô nhập bản dịch, tự lưu sau khoảng 0,8 giây. Bản dịch hoàn toàn do người dùng viết, ứng dụng không tự điền.
- Xuất các đoạn đã dịch ra file `.docx` theo từng chương.
- Tra từ nhanh: bôi đen một từ hoặc cụm từ để xem nghĩa, có thể lưu vào Sổ từ vựng kèm sách và chương nguồn.
- Đọc to bằng giọng của trình duyệt (Web Speech API): đọc từng đoạn, tạm dừng, đoạn trước và sau, tốc độ 0.75x đến 2x, chọn giọng, tô sáng đoạn đang đọc, tự sang chương kế.

**Giao diện**
- Tiếng Anh và tiếng Việt (chỉ đổi giao diện, không đổi nội dung sách).
- Tối giản, tương thích điện thoại, phím tắt cho người đọc.

## Phím tắt trong trang đọc

| Phím | Chức năng |
|---|---|
| `Space` | Cuộn xuống gần một màn hình (`Shift+Space` cuộn lên) |
| `↑` / `↓` | Cuộn lên / xuống từng chút |
| `←` / `→` | Chương trước / chương sau |
| `B` | Đánh dấu vị trí hiện tại |
| `T` | Bật hoặc tắt chế độ Dịch |
| `A` | Bật hoặc tắt đọc to |
| `F` | Toàn màn hình |
| `Esc` | Đóng thanh bên |

Các phím tắt không hoạt động khi đang gõ trong ô nhập.

## Công nghệ

| Phần | Công nghệ |
|---|---|
| Backend | ASP.NET Core MVC (.NET 8), kiến trúc Controllers, Services, ViewModels |
| Cơ sở dữ liệu | PostgreSQL, Entity Framework Core, `Npgsql` |
| Giao diện | HTML5, CSS3, JavaScript thuần (không framework), Bootstrap 5.3 |
| Đọc EPUB | `VersOne.Epub`, `HtmlAgilityPack` |
| Đọc PDF | `PdfPig` (lấy thông tin và ảnh bìa), trình xem PDF của trình duyệt |
| Đọc DOCX | `Mammoth.Core`, `DocumentFormat.OpenXml` |
| Tra từ nhanh | Điểm cuối Google Translate không chính thức, có bộ nhớ đệm 24 giờ |
| Đọc to | Web Speech API trên trình duyệt |
| Triển khai | Docker, Render (web), Supabase (PostgreSQL) |

## Cấu trúc thư mục

```
DualRead---DA/
├── DualRead.sln
├── render.yaml            Cấu hình triển khai Render
├── README.md
└── DualRead/
    ├── Controllers/       Điều hướng và API
    ├── Data/              DbContext
    ├── Models/            Thực thể và ViewModels
    ├── Services/          Xử lý nghiệp vụ, đọc EPUB, PDF, DOCX
    ├── Views/             Giao diện Razor (Home, Library, Reader)
    ├── wwwroot/           CSS và JavaScript
    ├── Migrations/        Lịch sử cấu trúc cơ sở dữ liệu
    ├── Dockerfile
    └── SETUP.md           Hướng dẫn chạy và triển khai chi tiết
```

## Chạy trên máy cá nhân

Yêu cầu: .NET 8 SDK và PostgreSQL.

```bash
cd DualRead
dotnet restore
dotnet run
```

Trước đó sửa chuỗi kết nối `ConnectionStrings:DefaultConnection` trong `appsettings.json` cho khớp PostgreSQL của bạn. Các bảng được tạo tự động khi khởi động. 
