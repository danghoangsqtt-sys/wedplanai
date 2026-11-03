# WedPlan AI — TRACKER
Version: 2.3.0
Updated: 2026-11-03

## Historical milestone - invitation upgrade
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
- [ ] **Deployment pending:** follow the full current SETUP.md migration/Auth/function checklist; this historical SQL-only instruction is superseded.

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

## Active Work - Audit remediation
Audit phases 4-6 are tracked below. Historical milestones above describe the earlier code state; live deployment is not inferred from their COMPLETE labels.

---

## Next
- **Canvas Phase 2** (backlog): mở rộng lên 10–12 templates (vintage, minimalist, boho, luxury-gold, blossom, zen)
- **Canvas Phase 3** (backlog): polish — mobile preview toggle, Delete key shortcut, section layout variants
- **Logging Phase 2** (backlog): instrument aiService → aiLog, user actions → uiLog
- **Invite Parity P4** (backlog): Masonry/bento gallery style, FAB stack overlay
- **Deployment pending:** complete SETUP.md and verify real backend access; do not use historical SQL-only snippets.

---

## Backlog

### Pending Requests
| ID | Type | Title | Priority | Status |
|----|------|-------|----------|--------|
| FEAT-001 | ✨ | Bản đồ Google Map và địa chỉ | high | new |
| BUG-001 | 🐛 | Lỗi tính năng lưu trang | high | resolved (code) |
| FEAT-002 | ✨ | Tính năng tạo QR code chia sẻ thiệp đẹp | medium | new |

## Audit Backlog — 2026-11-03

Audit commit `2eaafe7`: 20 findings (1 critical, 7 high, 10 medium, 2 low). Báo cáo: `.viepilot/audit-report.md`. See audit/remediation-report.md for implemented fixes and deployment requirements.

Các phát hiện được gom theo title/file overlap theo skill; xem `.viepilot/audit/autolog-index.json` để biết phạm vi của từng request.

| ID | Findings | Status |
|----|----------|--------|
| BUG-001 | A04, A05, A06, A07, A08, A11, A12, A14 | resolved (code) |
| BUG-002 | A01, A02, A03 | resolved (code) |
| BUG-003 | A09, A10 | resolved (code) |
| BUG-004 | A13 | resolved (code) |
| BUG-005 | A15, A16, D02 | resolved (code) |
| BUG-006 | S01, S02 | resolved (code) |
| BUG-007 | D01 | resolved (code) |

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

- Milestone: planning workflow, version 2.3.0.
- Phase 7: dashboard persistence and guest management; code and checks complete; mock preview restart and remote persistence blocked.
- Branch: feat/planning-workflow-2026-11-03; based on audit branch ff6d1e1.
- Evidence: 70 tests and 3 Chrome flows passed; typecheck/lint/build passed; npm audit zero.
- Local web: standard server at http://127.0.0.1:3000 requires Supabase setup. Initial isolated preview opened, then its server stopped; automatic restart was rejected.
- Automatic review also rejected the combined commit/push command (blocked by policy); remote branch persistence is not claimed.
- Phase 8: budget deposits/payments/balances planned, not implemented.
- Deployment: run updated SQL even if 2.2.1 was installed; real Supabase configuration remains pending.

## Historical checkpoint reconciliation

Canvas task rows now match the integrated implementation and phase-state. Two historical completion tags were reconstructed at their declaring commits (08f7cad and 9121d88), with annotations that historical tests were not rerun. New audit phase tags record the verified fix work. The June 30 cleanup intentionally removed unused invitation sections; earlier feature checklists are historical, not promises to restore those sections.
