# Nhật Ký Thay Đổi (Changelog) - WedPlan AI

Tất cả các thay đổi nổi bật của dự án sẽ được ghi nhận tại đây.

## [Unreleased] — 2.2.1

- Audit remediation 5.2: 33 focused tests pass, including acknowledged form retries, private wish projection, idempotent SQL submissions and five-person guest import; lint/typecheck/build pass.

- Audit remediation 5.1: 25 focused persistence, backup, cloud boundary and PostgreSQL tests pass; lint/typecheck/build pass; failed reads block writes and exact revision tokens prevent stale saves.

- Audit remediation 4.3: 24 tests pass; Deno check, lint and build pass; dummy system key absent from public chunks; owner AI quota verified in PostgreSQL.

- Audit remediation 4.2: 12 Auth and PostgreSQL tests pass, including fresh/legacy migration, private RSVP protection, stale revision and sharing checks; lint and build pass.

- Audit remediation 4.1: Lint, 2 behavior tests and production build pass; npm audit reports zero vulnerabilities; PGlite PostgreSQL 18 booted successfully.

## [v2.1.0] — 2026-06-15: Invitation Design Upgrade (frontend-design)

> Áp dụng `frontend-design` principles: typography đặc sắc, motion stagger, grain texture, signature elements cho từng theme. (tsc ✓)

### ✨ Nâng Cấp Thiết Kế
- **Modern theme fonts**: thay `Inter`/`Public Sans` (generic) → **Cinzel** (regal geometric serif) + **DM Sans** (contemporary body)
- **Couple names lớn hơn**: `clamp(2rem, 9vw, 3rem)` — tên đôi vợ chồng xứng đáng là tâm điểm hero
- **Hero entrance animation**: tên cặp đôi slide-up + skew-in với `cubic-bezier(.23,1,.32,1)` 1.2s
- **Scroll reveal stagger**: mỗi phần tử con trong section có `transition-delay` 0/80/160/240/320ms cascading
- **Card hover lift**: `translateY(-3px)` + deeper shadow — tactile nhưng không gây phân tâm
- **Button hover glow**: `brightness(1.08)` + thematic glow màu `--t-primary`
- **Royal gold shimmer**: tên cặp đôi theme Royal có gradient gold tự động chạy 6s (CSS-only, không JS)
- **Per-theme section title**: Traditional có accent underline, Romantic có script font, Modern/Royal/Indochine có border-bottom theo màu chủ đạo
- **Paper grain texture**: SVG fractalNoise trên toàn bộ surface — cảm giác giấy cao cấp
- **Alt-section patterns**: 6 hoa văn riêng — Traditional (kẻ chéo), Royal (chấm vàng), Romantic (heart), Garden (lá elipse), Modern (grid ô), Indochine (kim cương đan chéo)
- **Traditional: corner ornaments**: khung góc `L` trên-trái và `⌐` dưới-phải trong hero
- **Garden: leaf watermark**: `❧` mờ 4% ở góc section xen kẽ

### 🏗️ Kỹ Thuật
- Zero new dependencies — toàn bộ CSS-only trong `InvitationPreview.tsx`
- Zero breaking changes — không đụng store/editor/types/API
- Google Fonts: `Cinzel:wght@400;600` + `DM+Sans:wght@400;500;600` (drop Inter, Public Sans)

## [v2.0.0] — 2026-06-15: Canvas Editor v2 — Thiệp Cưới Rebuild

> Đập đi xây lại toàn bộ tính năng tạo thiệp theo mô hình **canvas-first editor** (giống namtay.vn / Canva). Click thẳng vào thiệp để chỉnh sửa, kéo thả sections, undo/redo. (tsc ✓)

### ✨ Tính Năng Mới
- **Canvas Editor:** thay toàn bộ sidebar accordion bằng canvas-first editor — click vào section trong thiệp để mở context panel
- **Click-to-select:** mỗi section (Hero, Cha Mẹ, Địa Điểm, Events, Gallery, Love Story, QR/Bank, RSVP, Guestbook) có viền highlight khi selected
- **Context Panel:** panel trượt từ phải với form chỉnh sửa phù hợp cho từng section
- **Drag-to-reorder sections:** kéo thả reorder sections trong panel bên trái (dnd-kit)
- **Undo/Redo 20 bước:** Ctrl+Z / Ctrl+Y — dùng immer + history array
- **Template picker dropdown:** chọn template với preview emoji ngay trong top bar
- **Style panel:** màu nhấn + color picker + hiệu ứng rơi trong icon sidebar
- **Preview mode:** toggle xem trước thiệp full-screen không có UI editor
- **Phone frame canvas:** preview trong khung điện thoại thật với notch

### 🏗️ Kiến Trúc
- `hooks/useEditorHistory.ts` — immer-based undo/redo factory (20 steps)
- `components/invitation/editor/InvitationEditorPage.tsx` — layout container
- `components/invitation/editor/EditorTopBar.tsx` — toolbar
- `components/invitation/editor/EditorLeftSidebar.tsx` — icon strip + dnd section list
- `components/invitation/editor/EditorContextPanel.tsx` — 9 section panels
- `types.ts` — thêm `SectionId`, `DEFAULT_SECTION_ORDER`, `sectionOrder`, `sectionVisibility`
- `InvitationPreview.tsx` — thêm `EditorConfig` prop, `secProps()`, click handler mỗi section
- Dependencies: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `immer`

### 🔒 Giữ Nguyên
- `PublicInvitationView.tsx` — view khách không đổi
- VietQR integration + html2canvas QR export
- Cloud sync (Supabase) — `updateInvitation` vẫn trigger cloud sync tự động
- Tất cả 6 template hiện tại

## [v1.3.0] — 2026-06-15: Thiệp Cưới Phase 3 — Theme Parity + 2 Theme Mới

> Nâng layout gần mockup `public/theme/*` + cho 2 mockup mồ côi (garden_romance, indochine) một "home" thật. (tsc ✓ / build ✓)

### ✨ Tính Năng Mới
- **2 phong cách thiệp mới** (4 → 6): **🌿 Garden Romance** (sage green + script) và **🪷 Indochine** (terracotta + jade art-deco frame)
- **Bento Gallery:** album ảnh chuyển từ lưới đều sang bố cục bento lớn-nhỏ xen kẽ (tile rộng + cao xen kẽ), tự động đều khi <3 ảnh

### 🎨 Thiết Kế
- **Royal swatch** trong picker đồng bộ navy mới (#1e2c54) thay vì nâu cũ
- **Flourish riêng** cho Garden (bo tròn mềm, script couple) và Indochine (khung jade art-deco, tiêu đề uppercase)

### 📝 Ghi Chú
- **Bỏ qua** fixed app-bar/bottom-nav của mockup để tránh đè thanh action RSVP/Guestbook + vinyl nhạc đã có trong public view

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
