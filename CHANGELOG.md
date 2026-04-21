# Nhật Ký Thay Đổi (Changelog) - WedPlan AI

Tất cả các thay đổi nổi bật của dự án sẽ được ghi nhận tại đây.

## [Phiên bản Cập Nhật Mới Nhất] - Tháng 4/2026

### ✨ Tính Năng Mới (Features)
- **Thiệp Mời Kỹ Thuật Số Nâng Cao:**
  - Tích hợp hệ thống nhãn dán (Sticker Decoration System) cho thiệp.
  - Phân loại hình ảnh trang trí trực quan theo chủ đề: Hoa Cỏ (Floral), Lãng mạn (Romantic), Sang trọng (Luxury), và Sân vườn (Garden).
  - Tăng cường trải nghiệm mở thiệp (Unboxing Experience) với hoạt ảnh cánh hoa rơi, phong bì 3D nổi bật, ánh sáng lấp lánh và tích hợp phát nhạc nền tự động.
- **Tiện Ích Khách Mời (Guest Experience):** 
  - Đã chuyển đổi màn hình Check-in bằng mã QR từ cửa sổ nổi (overlay) sang dạng bảng trượt bên hông (toggleable side panel) mượt mà và trực quan hơn.

### 🛠️ Cải Thiện & Sửa Lỗi (Enhancements & Fixes)
- **Cải Thiện Giao Diện Người Dùng (UI/UX):**
  - **Sạch sẽ và Chuyên Nghiệp:** Loại bỏ hoàn toàn tính năng "AI Gợi ý" và "Mẹo hay" dư thừa trong module *Lộ trình chuẩn bị (Command Center)* để tập trung vào trải nghiệm cốt lõi, giúp giao diện gọn gàng, giảm thiểu rối mắt.
  - Sửa lỗi hiệu ứng hạt (Hearts, Sparkles) khi mô phỏng rơi tự do bị ẩn sai hướng trên màn hình.
- **Cải Tiến Trí Tuệ Nhân Tạo (AI System):**
  - Cấu trúc lại logic gọi API của nhân Cố vấn AI, gia tăng độ phản hồi và sức chịu tải với cơ chế tự động thử lại (Retry) tích hợp. Hệ thống hiện đã tự động vượt qua các lỗi sập kết nối máy chủ 50x (503 Service Unavailable, 429 Too Many Requests).
  - Tối ưu hóa cơ chế nhận diện API Key an toàn và bảo mật, sử dụng fallback linh hoạt dựa trên quyền thành viên của người dùng.
- **Nâng Cấp Hệ Thống / Kiến Trúc:**
  - Ổn định tính năng đồng bộ hóa mạng lưới thời gian thực trong *Kế hoạch chung (Shared Plan)* giữa Chủ sở hữu (Owner) và Đối tác (Partner).
  - Cải tiến hiệu suất Render và tốc độ tải trang cực nhanh với quy trình khởi tạo từ phiên bản nền tảng gốc.
