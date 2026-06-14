# Brainstorm Session — Nâng Cấp Tính Năng Thiệp Cưới

**Date:** 2026-06-15
**Type:** Audit + Upgrade (UI/UX)
**Trigger:** `/vp-brainstorm` + `/vp-audit` + `/vp-auto` — "theme chính là mẫu áp dụng cho tính năng thiệp cưới, nâng cấp để thiệp cưới tạo ra chuyên nghiệp và hiện đại"

---

## Context

`public/theme/` chứa các mockup thiết kế chuẩn (Timeless Heritage + Alexandria design systems, 10 HTML prototypes polished). Đây là **mẫu tham chiếu** cho tính năng thiệp cưới. Mã nguồn React thực tế (`InvitationPreview.tsx`) đang **lạc hậu và lỗi** so với các mockup này.

Kiến trúc thiệp:
- `InvitationManager.tsx` — editor (sidebar + live preview trong khung điện thoại)
- `InvitationPreview.tsx` — renderer dùng CSS-variable theme system (4 theme: traditional/romantic/modern/royal)
- `PublicInvitationView.tsx` — trang khách xem (`?view=invitation&uid=`), có RSVP modal + Guestbook modal
- `cloudService.ts` — lưu/tải qua Supabase (`user_data`, `public_invitations`)

---

## Audit Findings

### 🔴 CRITICAL — Lỗi mất dữ liệu / tính năng giả
- **C1 — RSVP bị vứt bỏ:** `RSVPModal.handleSubmit` chỉ `setSubmitted(true)`. Tên/SĐT/số người/ghi chú khách → mất. (`PublicInvitationView.tsx:18`)
- **C2 — Lời chúc chỉ lưu localStorage:** `wishes_${uid}` trên máy khách. Cô dâu chú rể không nhận được; khách không thấy nhau. (`PublicInvitationView.tsx:283`)
- **C3 — Nút RSVP trong thiệp chết:** props `onRSVP/onGuestbook` khai báo nhưng không nối; `iv-rsvp-btn` không có onClick. (`InvitationPreview.tsx:442`)

### 🟠 MAJOR — Editor thu thập dữ liệu Preview không hiển thị
- `groomParents`/`brideParents` (Nhà Trai/Nhà Gái) — **không render** (phần lễ nghi VN quan trọng nhất)
- `headerSticker`/`dividerSticker`/`footerSticker` — không render
- `themeColor` (8 màu picker) — không dùng
- `loveStory[].photo` — không render (có UI upload)
- `mapLink`/`address`/`location` top-level — chỉ hiện trong event con; không có event → mất hút
- **Royal ≈ Traditional**: cùng font + nâu ấm, không có gì "hoàng gia"

### 🟡 MODERATE
- `html2canvas` dùng `allowTaint:true` + `useCORS:true` cùng lúc (mâu thuẫn → export QR fragile)
- Nút "Lưu Thiệp" = `alert()` giả
- `useScrollReveal(data)` re-observe mỗi keystroke
- Gallery URL dùng `prompt()`

---

## Decisions

| # | Quyết định | Lý do |
|---|---|---|
| D1 | Giữ kiến trúc single-component + CSS-variable theme system | Đúng đắn, themeable; chỉ cần lấp lỗ hổng, không rewrite kiến trúc |
| D2 | Phase 1 = render-completeness + theme distinction (không đụng DB) | Đây là cốt lõi "chuyên nghiệp & hiện đại", an toàn, verify được ngay |
| D3 | Royal → navy (#1e2c54) + gold (#c2a14d) + khung gold double-frame | Tạo theme thứ 3 thật sự khác biệt, đúng ý định mockup royal_elegance |
| D4 | `themeColor` override `--t-accent` | Biến color picker thành tính năng thật |
| D5 | RSVP/wishes cloud persistence → Phase 2 (cần 1 migration SQL) | Không thể viết RLS-dependent insert mù; cần tạo bảng trước |

---

## Phases

### Phase 1 — Render Completeness + Theme Polish ✅ COMPLETE (2026-06-15)
Implemented in `InvitationPreview.tsx` (full rewrite, build ✓ / tsc ✓):
1. ✅ Khối **Thư Mời — Cha Mẹ** (Nhà Trai/Nhà Gái, 2 cột + invite line + couple)
2. ✅ Khối **Địa Điểm Tổ Chức** (location/address/date/time + nút "Chỉ Đường" từ `mapLink`)
3. ✅ Render **sticker** (header trên tên, divider trong `<Divider glyph>`, footer)
4. ✅ Nối **`themeColor` → `--t-accent`** (color picker hoạt động)
5. ✅ Render **ảnh Love Story** trong timeline card
6. ✅ **Royal** = navy + gold + flourish riêng từng theme (`.iv-theme-{tid}`)
7. ✅ Nối **nút RSVP/Guestbook** → `onRSVP()`/`onGuestbook()`; thêm nút "Gửi Lời Chúc" in-content
8. ✅ Tối ưu `useScrollReveal` → dùng `revealKey` (chỉ re-observe khi đổi set sections)

### Phase 2 — RSVP & Guestbook Cloud Collection ✅ CODE COMPLETE (v1.2.0, 2026-06-15) — ⚠️ pending SQL migration
**Mục tiêu:** Cô dâu chú rể thật sự nhận được RSVP + lời chúc; khách thấy lời chúc của nhau.

**Đã làm (tsc ✓ / build ✓):** `lib/supabase.ts` (+TABLE), `cloudService.ts` (`submitRSVP`/`submitWish`/`loadInvitationResponses` graceful), `PublicInvitationView.tsx` (RSVP+wishes lên cloud, merge+dedupe), `InvitationManager.tsx` (panel "Phản Hồi Khách Mời"). **Còn lại:** user chạy SQL bên dưới.

**Cần 1 migration Supabase (chạy trong SQL Editor):**
```sql
-- Bảng lưu RSVP + lời chúc từ khách (public insert, owner read)
create table if not exists public.invitation_responses (
  id uuid primary key default gen_random_uuid(),
  uid uuid not null,                          -- OWNER_UID của thiệp
  kind text not null check (kind in ('rsvp','wish')),
  name text not null,
  phone text,
  attending text,                             -- 'yes' | 'no' (chỉ rsvp)
  guest_count int,                            -- (chỉ rsvp)
  message text,                               -- ghi chú rsvp / nội dung wish
  created_at timestamptz not null default now()
);
alter table public.invitation_responses enable row level security;

-- Khách (anon) được phép GHI phản hồi
create policy "anon insert responses" on public.invitation_responses
  for insert to anon with check (true);
-- Đọc công khai (để khách thấy lời chúc của nhau + owner xem dashboard)
create policy "public read responses" on public.invitation_responses
  for select to anon using (true);

create index if not exists idx_inv_resp_uid on public.invitation_responses (uid, kind, created_at desc);
```

**Client work (sau khi bảng tồn tại):**
- `cloudService.ts`: thêm `submitRSVP(uid, payload)`, `submitWish(uid, wish)`, `loadResponses(uid, kind)`
- `PublicInvitationView.tsx`: `RSVPModal.handleSubmit` → `submitRSVP` (thay vì vứt bỏ); `handleWishSubmit` → `submitWish` + load wishes từ cloud (thay localStorage-only)
- `InvitationManager.tsx`: panel "Phản hồi khách mời" hiển thị danh sách RSVP (ai đến / số người) + lời chúc

### Phase 3 — Theme parity với mockups (OPTIONAL/FUTURE)
- App bar + bottom nav, bento gallery, glass event cards khớp mockup `public/theme/*`
- Xử lý orphaned mockups (garden_romance, indochine) → thêm theme mới hoặc xóa

---

## Open Questions
- Phase 2: owner xem RSVP ở đâu — panel riêng trong InvitationManager hay tab mới? (đề xuất: panel trong Manager, gần QR Check-in)
- Có cần export danh sách RSVP ra Excel/CSV cho việc xếp bàn tiệc không?
- Phase 3: giữ 4 theme hay mở rộng theo các orphaned mockups?

## Action Items
- [x] Audit tính năng thiệp cưới
- [x] Phase 1 — render completeness + theme polish (build ✓)
- [ ] Phase 2 — chạy migration SQL → wire RSVP/wishes cloud
- [ ] Cập nhật CHANGELOG + memory

## Next
- Người dùng chạy `npm run dev`, mở tab Thiệp → dữ liệu thật từ cloud sẽ render đầy đủ các section mới
- Khi sẵn sàng Phase 2: chạy SQL ở trên rồi `/vp-auto` tiếp
