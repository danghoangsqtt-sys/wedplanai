# WedPlan AI — TRACKER
Version: 2.1.0
Updated: 2026-06-15

## Current Milestone
**Wedding Invitation Upgrade** — làm thiệp cưới chuyên nghiệp & hiện đại

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

## Previous Milestone
**Personal Tool Mode** (PIN gate + cloud auto-save + auth removal) — ✅ COMPLETE (v1.0.0)

## Completed — Debug Logging Phase 1 ✅
**Milestone:** Structured Logging
**Source:** `docs/brainstorm/session-2026-06-15-debug-logging.md`

| Task | Status |
|------|--------|
| `lib/logger.ts` — factory + exports | ✅ DONE |
| Instrument `cloudService.ts` | ✅ DONE |
| Instrument upload handlers | ✅ DONE |
| Instrument `useStore.ts` | ✅ DONE |

**SPEC:** `.viepilot/phases/logging-phase-1/SPEC.md`

## Completed — Canvas Editor v2 Phase 1 ✅
**Milestone:** Wedding Invitation Canvas Editor v2
**Source:** `docs/brainstorm/session-2026-06-15-invitation-canvas-rebuild.md`

| Task | Status |
|------|--------|
| C1.1–C1.12 (all 12 tasks) | ✅ DONE |

**New files:**
- `hooks/useEditorHistory.ts` — immer undo/redo
- `components/invitation/editor/InvitationEditorPage.tsx`
- `components/invitation/editor/EditorTopBar.tsx`
- `components/invitation/editor/EditorLeftSidebar.tsx`
- `components/invitation/editor/EditorContextPanel.tsx`

## Active Work — None
See **Next** section below.

---

## Next
- **Canvas Phase 2** (backlog): mở rộng lên 10–12 templates (vintage, minimalist, boho, luxury-gold, blossom, zen)
- **Canvas Phase 3** (backlog): polish — mobile preview toggle, Delete key shortcut, section layout variants
- **User action:** chạy SQL `invitation_responses` trong Supabase → RSVP/lời chúc thật chảy về
- **Logging Phase 2** (backlog): instrument aiService → aiLog, user actions → uiLog

---

## Backlog

### Pending Requests
| ID | Type | Title | Priority | Status |
|----|------|-------|----------|--------|
| FEAT-001 | ✨ | Bản đồ Google Map và địa chỉ | high | new |
| BUG-001 | 🐛 | Lỗi tính năng lưu trang | high | new |
| FEAT-002 | ✨ | Tính năng tạo QR code chia sẻ thiệp đẹp | medium | new |
