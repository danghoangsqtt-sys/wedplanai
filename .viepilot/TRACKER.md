# WedPlan AI — TRACKER
Version: 2.2.0
Updated: 2026-06-26

## Current Milestone
**Wedding Invitation Upgrade v2** — làm thiệp cưới chuyên nghiệp & hiện đại

### Phase 1 — Render Completeness + Theme Polish
**Status:** ✅ COMPLETE (v1.1.0)
- [x] Khối Cha Mẹ (Nhà Trai/Nhà Gái), khối Địa Điểm + Chỉ Đường
- [x] Render sticker (header/divider/footer), wire `themeColor`→accent, ảnh love story
- [x] Royal navy+gold khác biệt + flourish từng theme; nối nút RSVP/Guestbook
- [x] 0 TS errors, build pass

### Phase 2 — RSVP & Guestbook Cloud Collection
**Status:** ✅ CODE COMPLETE (v1.2.0) — ⚠️ pending SQL migration để go-live
- [x] `submitRSVP` / `submitWish` / `loadInvitationResponses` (graceful)
- [x] Public view wire RSVP + wishes lên cloud; owner panel "Phản Hồi Khách Mời"
- [x] 0 TS errors, build pass
- [ ] **User action:** chạy SQL `invitation_responses` trong Supabase (session doc)

### Phase 3 — Theme Parity + Wedding Invite Feature Parity
**Status:** ✅ COMPLETE (v2.2.0) — 2026-06-26
- [x] Garden Romance + Indochine themes (THEME_VARS, InvitationManager buttons)
- [x] **Scroll "slice" animation** — `.rv`/`.rv-on` CSS + IntersectionObserver hook
- [x] **Calendar Section** — Vietnamese calendar, ngày cưới dark circle highlight
- [x] **Couple Profile Section** — circular photo + bio + "Xem thêm" expand toggle
- [x] **Multi-event RSVP checkboxes** — A&Q reference style, `rsvpMultiEvent` flag
- [x] **Guestbook Email Field** — optional via `guestbookEmailEnabled`
- [x] **Add-to-Calendar** — Google Calendar link + .ics download per event
- [x] New SectionIds: `calendar`, `coupleProfile`, `opening` in sidebar + panels
- [x] `CoupleProfile`, `RSVPEventSelection` interfaces in `types.ts`
- [x] 0 TS errors, build pass

## Previous Milestones
**Personal Tool Mode** (PIN gate + cloud auto-save + auth removal) — ✅ COMPLETE (v1.0.0)

## Completed — Debug Logging Phase 1 ✅
| Task | Status |
|------|--------|
| `lib/logger.ts` — factory + exports | ✅ DONE |
| Instrument `cloudService.ts` | ✅ DONE |
| Instrument upload handlers | ✅ DONE |
| Instrument `useStore.ts` | ✅ DONE |

## Completed — Canvas Editor v2 Phase 1 ✅
| Task | Status |
|------|--------|
| C1.1–C1.12 (all 12 tasks) | ✅ DONE |

---

## Active Work — None
All planned phases complete. See **Next** section below.

---

## Next
- **Canvas Phase 2** (backlog): mở rộng lên 10–12 templates (vintage, minimalist, boho, luxury-gold, blossom, zen)
- **Canvas Phase 3** (backlog): polish — mobile preview toggle, Delete key shortcut, section layout variants
- **Logging Phase 2** (backlog): instrument aiService → aiLog, user actions → uiLog
- **Invite Parity P4** (backlog): Masonry/bento gallery style, FAB stack overlay
- **User action:** chạy SQL `invitation_responses` trong Supabase → RSVP/lời chúc thật chảy về

---

## Backlog

### Pending Requests
| ID | Type | Title | Priority | Status |
|----|------|-------|----------|--------|
| FEAT-001 | ✨ | Bản đồ Google Map và địa chỉ | high | new |
| BUG-001 | 🐛 | Lỗi tính năng lưu trang | high | new |
| FEAT-002 | ✨ | Tính năng tạo QR code chia sẻ thiệp đẹp | medium | new |
