# WedPlan AI — TRACKER
Version: 1.2.0
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

## Active Work — Debug Logging & Observability
**Milestone:** Structured Logging
**Source:** `docs/brainstorm/session-2026-06-15-debug-logging.md`

| Task | Status |
|------|--------|
| `lib/logger.ts` — factory + exports | ✅ DONE |
| Instrument `cloudService.ts` | ✅ DONE |
| Instrument upload handlers | ✅ DONE |
| Instrument `useStore.ts` | ✅ DONE |

**SPEC:** `.viepilot/phases/logging-phase-1/SPEC.md`

---

## Next
- **Logging Phase 1:** instrument cloud + upload + store (xem SPEC)
- User chạy SQL migration → RSVP/lời chúc thật chảy về
- (Optional) Phase 3 — theme parity với mockups `public/theme/*`
