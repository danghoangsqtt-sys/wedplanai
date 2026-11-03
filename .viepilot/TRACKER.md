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

## Audit Backlog — 2026-11-03

Audit commit `2eaafe7`: 20 findings (1 critical, 7 high, 10 medium, 2 low). Báo cáo: `.viepilot/audit-report.md`. Chưa thực hiện bản sửa.

Các phát hiện được gom theo title/file overlap theo skill; xem `.viepilot/audit/autolog-index.json` để biết phạm vi của từng request.

| ID | Findings | Status |
|----|----------|--------|
| BUG-001 | A04, A05, A06, A07, A08, A11, A12, A14 | new |
| BUG-002 | A01, A02, A03 | new |
| BUG-003 | A09, A10 | new |
| BUG-004 | A13 | new |
| BUG-005 | A15, A16, D02 | new |
| BUG-006 | S01, S02 | new |
| BUG-007 | D01 | new |

## Decision Log

| Date | Decision | Source | State |
|------|----------|--------|-------|
| 2026-11-03 | BUG-002 auto-logged by vp-audit Tier 3: PIN chỉ bảo vệ giao diện; SQL cho phép khách ẩn danh truy cập dữ liệu riêng | vp-audit | Backlog |
| 2026-11-03 | BUG-003 auto-logged by vp-audit Tier 3: Ẩn section và kéo đổi thứ tự chỉ cập nhật sidebar, không cập nhật thiệp | vp-audit | Backlog |
| 2026-11-03 | BUG-004 auto-logged by vp-audit Tier 3: Import RSVP nhóm nhiều người chỉ tạo một khách trong kế hoạch | vp-audit | Backlog |
| 2026-11-03 | BUG-005 auto-logged by vp-audit Tier 3: Lockfile có 14 package bị npm audit cảnh báo | vp-audit | Backlog |
| 2026-11-03 | BUG-006 auto-logged by vp-audit Tier 1: ROADMAP và trạng thái phase/tracker không nhất quán | vp-audit | Backlog |
| 2026-11-03 | BUG-007 auto-logged by vp-audit Tier 2: Hướng dẫn cài đặt vẫn yêu cầu Appwrite trong khi mã nguồn dùng Supabase | vp-audit | Backlog |

## Current State

- Milestone: audit remediation, target 2.2.1.
- Last verified task: 4.3.
- Current task: 5.1; 3/7 tasks verified.
- Branch: fix/audit-2026-11-03.
- Evidence: 24 tests pass; Deno check, lint and build pass; dummy system key absent from public chunks; owner AI quota verified in PostgreSQL.
- Deployment: live SQL/function/Auth setup remains to be applied with actual configuration.
