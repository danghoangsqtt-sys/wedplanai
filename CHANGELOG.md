# Nhật Ký Thay Đổi (Changelog) - WedPlan AI

Tất cả các thay đổi nổi bật của dự án sẽ được ghi nhận tại đây.

## [v1.2.0] — 2026-06-15: Thiệp Cưới Phase 2 — RSVP & Lời Chúc Lưu Cloud

> Sửa 2 lỗi nghiêm trọng nhất: RSVP của khách trước đây bị **vứt bỏ hoàn toàn**, lời chúc chỉ lưu trên máy khách. Nay lưu cloud thật để cô dâu chú rể nhận được. (tsc ✓ / build ✓)
>
> ⚠️ **Cần 1 bước thủ công:** chạy migration SQL (bảng `invitation_responses` + RLS) trong Supabase SQL Editor — SQL đầy đủ trong `docs/brainstorm/session-2026-06-15-invitation-upgrade.md`. Code degrade an toàn (không crash) khi bảng chưa tồn tại.

### ✨ Tính Năng Mới
- **RSVP lưu cloud:** Khách xác nhận tham dự (tên, SĐT, số người, ghi chú) → lưu vào bảng `invitation_responses`
- **Lời chúc lưu cloud:** Guestbook ghi lên cloud → khách thấy lời chúc của nhau + cô dâu chú rể nhận được (trước chỉ `localStorage` trên máy khách)
- **Bảng điều khiển Phản Hồi cho chủ thiệp:** Section "Phản Hồi Khách Mời" trong editor — xem danh sách RSVP (ai đến / tổng số khách / SĐT / ghi chú) + toàn bộ lời chúc, nút tải lại

### 🛠️ Kỹ Thuật
- `cloudService.ts`: thêm `submitRSVP`, `submitWish`, `loadInvitationResponses` (try/catch graceful — trả default khi bảng chưa migrate, không crash trang công khai)
- `lib/supabase.ts`: thêm `INVITATION_RESPONSES` vào `TABLES`
- `PublicInvitationView.tsx`: `RSVPModal` nhận prop `onSubmit`; merge cloud + local + legacy wishes, dedupe theo id

## [v1.1.0] — 2026-06-15: Nâng Cấp Thiệp Cưới (Phase 1 — Render Completeness)

> Audit phát hiện editor thu thập nhiều dữ liệu mà thiệp **không hiển thị**. Phase 1 lấp toàn bộ lỗ hổng đó + làm 4 theme thật sự khác biệt. (`InvitationPreview.tsx` rewrite — build ✓ / tsc ✓)

### ✨ Tính Năng Mới
- **Khối Thư Mời — Cha Mẹ Hai Bên:** Render Nhà Trai / Nhà Gái (Ông/Bà) dạng 2 cột trang trọng — phần lễ nghi cưới VN trước đây bị thiếu hoàn toàn
- **Khối Địa Điểm Tổ Chức:** Hiển thị địa điểm/địa chỉ/ngày/giờ + nút **Chỉ Đường** (từ `mapLink`) — trước đây mất hút nếu không tạo event con
- **Sticker hiển thị thật:** `headerSticker` (trên tên), `dividerSticker` (đường phân cách), `footerSticker` (chân thiệp) — trước là 3 toggle dữ liệu chết
- **Màu Chủ Đạo hoạt động:** `themeColor` (8 màu picker) nay override accent của thiệp
- **Ảnh Love Story:** Timeline kỷ niệm nay render ảnh đã upload

### 🎨 Thiết Kế
- **Royal Elegance khác biệt thật sự:** đổi từ nâu (trùng Traditional) sang **navy `#1e2c54` + gold `#c2a14d`** với khung gold double-frame ornamental
- **Flourish riêng từng theme:** `.iv-theme-{traditional|romantic|modern|royal}` — tiêu đề, icon, frame riêng cho mỗi phong cách

### 🛠️ Sửa Lỗi & Cải Thiện
- **Nối nút RSVP/Guestbook chết:** `iv-rsvp-btn` + nút "Gửi Lời Chúc" nay gọi `onRSVP()`/`onGuestbook()` đúng cách
- **Tối ưu scroll-reveal:** `useScrollReveal` dùng `revealKey` thay vì cả object `data` — không re-observe mỗi keystroke
- **Empty-state an toàn:** ẩn lời chúc/section khi field trống thay vì hiện placeholder thừa

### ⏭️ Phase 2 (đã lên kế hoạch, cần 1 migration SQL)
- RSVP + lời chúc lưu cloud thật (bảng `invitation_responses`) → cô dâu chú rể nhận được phản hồi; khách thấy lời chúc của nhau. Chi tiết: `docs/brainstorm/session-2026-06-15-invitation-upgrade.md`

## [v1.0.0] — 2026-06-15: Personal Tool Mode

### ✨ Tính Năng Mới
- **Màn hình PIN bảo vệ:** Hiển thị màn hình nhập mật khẩu (PIN hash SHA-256) mỗi lần mở app; session tự khoá khi đóng tab
- **Supabase Auto-Save:** Toàn bộ dữ liệu (khách mời, ngân sách, thiệp cưới, phong thủy) tự động sync lên cloud sau 2 giây debounce
- **Load từ cloud khi khởi động:** Sau khi nhập PIN đúng, app tự động tải dữ liệu mới nhất từ Supabase
- **Fixed owner identity:** Dùng UUID cố định (`OWNER_UID`) thay cho auth system

### 🗑️ Loại Bỏ
- **Auth system:** Xóa hoàn toàn login page, role-based guards, ADMIN/USER/GUEST logic
- **Admin panel:** Xóa UserManagement component và admin nav tab
- **Admin dead code:** Loại bỏ `adminUsers`, `adminStats`, `fetchAdminData`, `addUser`, `deleteUser`, `refreshUserProfile` khỏi store
- **Role badges:** Xóa role badge khỏi SideNav, Sidebar, MobileDrawer, BottomNav

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
