# WedPlan AI — ROADMAP
Version: 2.4.0
Updated: 2026-11-03

---

## Historical Phase 1 — Password Gate + Cloud Auto-Save
**Status:** ✅ COMPLETE
**Source:** `docs/brainstorm/session-2026-06-15.md`

### Goals
- Bảo vệ app bằng màn hình PIN (personal tool)
- Kích hoạt lại Supabase auto-save để không bao giờ mất dữ liệu
- Tất cả nội dung (thiệp cưới, khách mời, ngân sách...) tự động lưu cloud

### Tasks
| # | Task | File | Status |
|---|---|---|---|
| 1.1 | Tạo `lib/constants.ts` — OWNER_UID + PIN_HASH | `lib/constants.ts` | ✅ DONE |
| 1.2 | Tạo `components/PasswordGate.tsx` — PIN screen UI | `components/PasswordGate.tsx` | ✅ DONE |
| 1.3 | Wrap `App.tsx` với `<PasswordGate>` | `App.tsx` | ✅ DONE |
| 1.4 | Implement `triggerCloudSync` trong store | `store/useStore.ts` | ✅ DONE |
| 1.5 | Thêm `loadFromCloud` action + expose ra store | `store/useStore.ts` | ✅ DONE |
| 1.6 | Gọi `loadFromCloud` trong `PasswordGate` sau khi unlock | `components/PasswordGate.tsx` | ✅ DONE |

### Historical acceptance checklist

This unchecked checklist is preserved as the original record, not a current verification claim. The PIN design is superseded by verified Supabase Auth in audit phase 4. Current release acceptance is recorded in audit phases 4-6.
- [ ] Mở app → thấy PIN screen
- [ ] Nhập PIN đúng → app mở, dữ liệu cloud được load
- [ ] Thay đổi bất kỳ (guest/budget/thiệp) → tự động sync Supabase sau 2s
- [ ] Đóng tab → mở lại → PIN screen xuất hiện lại
- [ ] Mở lại sau khi đã nhập PIN → dữ liệu vẫn còn (cloud load)

---

## Milestone: Debug Logging & Observability
**Source:** `docs/brainstorm/session-2026-06-15-debug-logging.md`

### Logging Phase 1 — Core Logger + Cloud + Upload + Store
**Status:** ✅ COMPLETE
**SPEC:** `.viepilot/phases/logging-phase-1/SPEC.md`

| # | Task | Files | Status |
|---|------|-------|--------|
| L1.0 | Tạo `lib/logger.ts` — factory + pre-built loggers | `lib/logger.ts` | ✅ DONE |
| L1.1 | Instrument `cloudService.ts` → `cloudLog` + `uploadLog` timing | `services/cloudService.ts` | ✅ DONE |
| L1.2 | Instrument upload handlers → `uploadLog` + group | `components/invitation/InvitationManager.tsx` | ✅ DONE |
| L1.3 | Instrument `useStore.ts` cloud sync → `storeLog` | `store/useStore.ts` | ✅ DONE |

### Logging Phase 2 — AI + User Actions
**Status:** ⬜ BACKLOG

| # | Task | Files | Status |
|---|------|-------|--------|
| L2.1 | Instrument `aiService.ts` / `geminiService.ts` → `aiLog` + timing | `services/aiService.ts`, `services/geminiService.ts` | ⬜ TODO |
| L2.2 | Instrument key user actions trong `InvitationManager` → `uiLog` | `components/invitation/InvitationManager.tsx` | ⬜ TODO |
| L2.3 | Instrument `SettingsPage.tsx` date change → `uiLog` | `components/SettingsPage.tsx` | ⬜ TODO |

### Logging Phase 3 — Polish (optional)
**Status:** ⬜ BACKLOG

| # | Task | Notes |
|---|------|-------|
| L3.1 | `console.group` cho gallery batch upload | Nhóm N files vào 1 collapsible group |
| L3.2 | Performance budget warning upload > 10s | `uploadLog.warn('slow upload', { ms })` |
| L3.3 | Log summary khi component unmount | Tổng errors trong session |

---

## Milestone: Wedding Invitation Canvas Editor v2
**Source:** `docs/brainstorm/session-2026-06-15-invitation-canvas-rebuild.md`
**Trigger:** Rebuild toàn bộ tính năng tạo thiệp — canvas-first editor như namtay.vn

### Canvas Phase 1 — Editor Core
**Status:** ✅ COMPLETE (2026-06-15)

| # | Task | Files | Status |
|---|------|-------|--------|
| C1.1 | `InvitationEditorPage.tsx` — layout container | `components/invitation/editor/InvitationEditorPage.tsx` | ✅ DONE |
| C1.2 | `EditorTopBar.tsx` — Undo/Redo, Template picker, Preview, Share | `components/invitation/editor/EditorTopBar.tsx` | ✅ DONE |
| C1.3 | `EditorLeftSidebar.tsx` — icon strip | `components/invitation/editor/EditorLeftSidebar.tsx` | ✅ DONE |
| C1.4 | Canvas phone frame (integrated) | `components/invitation/editor/InvitationEditorPage.tsx` | done |
| C1.5 | SortableSectionRow (integrated) | `components/invitation/editor/EditorLeftSidebar.tsx` | done |
| C1.6 | Inline rich-text editor | `components/invitation/InlineRichText.tsx` | done |
| C1.7 | Shared section renderer | `components/invitation/InvitationPreview.tsx` | done |
| C1.8 | Context panels (integrated) | `components/invitation/editor/EditorContextPanel.tsx` | done |
| C1.9 | Section visibility (integrated) | `components/invitation/editor/EditorLeftSidebar.tsx` | done |
| C1.10 | Undo/Redo system (`useEditorHistory` hook, immer, 20 steps) | `hooks/useEditorHistory.ts` | ✅ DONE |
| C1.11 | `InvitationData` migration: `sectionOrder`, `sectionVisibility` | `types.ts` | ✅ DONE |
| C1.12 | Wire vào App.tsx — thay InvitationManager bằng InvitationEditorPage | `App.tsx` | ✅ DONE |

**Constraints:**
- Giữ nguyên: `PublicInvitationView.tsx`, `cloudService.ts`, VietQR + html2canvas QR, `useStore.ts`
- Desktop-only editor (≥768px), 1 instance per section type
- Undo/Redo: immer + 20 steps
- @dnd-kit/core cho drag-and-drop

### Canvas Phase 2 — Templates Expansion
**Status:** ⬜ BACKLOG

| # | Task | Notes |
|---|------|-------|
| C2.1 | Rebuild CSS 6 templates cũ (canvas-ready CSS variables) | traditional, romantic, modern, royal, garden, indochine |
| C2.2 | 6 template mới | vintage, minimalist, boho, luxury-gold, blossom, zen |
| C2.3 | Template picker UI với live mini-preview (scale transform) | EditorTopBar |

### Canvas Phase 3 — Polish
**Status:** ⬜ BACKLOG

| # | Task | Notes |
|---|------|-------|
| C3.1 | Keyboard shortcuts: Ctrl+Z/Y, Delete, Escape | `useEditorKeyboard` hook |
| C3.2 | Mobile preview mode toggle (375px / 768px frame) | EditorTopBar |
| C3.3 | Section layout variants: heroLayout, galleryLayout | context panels |


## Audit remediation - target 2.2.1 (2026-11-03)

Scope: A01-A16, S01/S02, D01/D02. Existing feature-expansion backlogs remain outside this fix milestone.

| Phase | Name | Tasks | Verified | Status |
|---|---|---:|---:|---|
| 4 | Secure foundation | 3 | 3 | complete |
| 5 | Reliable data and RSVP | 2 | 2 | complete |
| 6 | Editor and release validation | 2 | 2 | complete |

## Historical invitation parity milestone - 2.2.0

- Phase 2: code complete; deployment SQL is superseded by the 2.2.1 migration, with live application still to be verified.
- Phase 3: complete as declared at 9121d88; fields/sections removed intentionally at 2eaafe7 are not reintroduced by this fix release.
- Canvas historical checkpoint: `wedplanai-legacy-canvas-vp-p1-complete` -> `08f7cad`.
- Invitation historical checkpoint: `wedplanai-legacy-invitation-vp-p3-complete` -> `9121d88`.
- Historical tag annotations distinguish declared completion from independently rerun verification. Current fixes have new tested checkpoints.

## Planning workflow - 2.3.0

| Phase | Name | Tasks | Status |
|---|---|---:|---|
| 7 | Dashboard persistence, detailed guests, local preview | 3 | code verified locally; browser regression passed in phases 9/8 |
| 8 | Deposits, staged payments and outstanding balances | 3 | code verified locally; remote/deployment not performed |

Specs: `.viepilot/phases/planning-phase-7/SPEC.md`, `.viepilot/phases/planning-phase-8/SPEC.md`. The user selected both visual RSVP/table management and detailed contact/group management. Budget payments were not included in 2.3.0; the approved implementation ships locally in 2.4.0.

## Personal access correction - 2.3.1

Phase 9 restores the owner-requested personal PIN by default, with local-only persistence and optional existing verified cloud session. Three tasks are code verified locally; remote persistence is not claimed. See `.viepilot/phases/personal-access-phase-9/SPEC.md` and SUMMARY.md. Phase 8 retains this access preference.

## Budget ledger — 2.4.0

The user approved both prototype workspaces and requested implementation with “okey làm đi” on 2026-11-03. Phase 8 covers the canonical model, actual forms and dashboard together. Planned due dates are exclusively T−N/T/T+N; actual payments keep calendar dates. Deposits are part of paid, legacy records require reconciliation, and provisional amounts stay separate from confirmed supplier debt. Existing JSONB supports the feature without a new migration. Local evidence and remaining remote/deployment limits are recorded in phase 8 SUMMARY.md.
