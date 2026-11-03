# WedPlan AI — ROADMAP
Version: 2.1.0
Updated: 2026-06-18

---

## Phase 1 — Password Gate + Cloud Auto-Save
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

### Definition of Done
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
| C1.1 | `InvitationEditorPage.tsx` — layout container | `components/invitation/editor/InvitationEditorPage.tsx` | ⬜ TODO |
| C1.2 | `EditorTopBar.tsx` — Undo/Redo, Template picker, Preview, Share | `components/invitation/editor/EditorTopBar.tsx` | ⬜ TODO |
| C1.3 | `EditorLeftSidebar.tsx` — icon strip | `components/invitation/editor/EditorLeftSidebar.tsx` | ⬜ TODO |
| C1.4 | `EditorCanvas.tsx` — phone frame + @dnd-kit SortableContext | `components/invitation/editor/EditorCanvas.tsx` | ⬜ TODO |
| C1.5 | `SectionWrapper.tsx` — HOC drag handle + selected state + floating toolbar | `components/invitation/editor/SectionWrapper.tsx` | ⬜ TODO |
| C1.6 | `InlineTextEditor.tsx` — contentEditable overlay | `components/invitation/editor/InlineTextEditor.tsx` | ⬜ TODO |
| C1.7 | Section components: Hero, Family, Events, Gallery, LoveStory, Bank, Footer | `components/invitation/editor/sections/` | ⬜ TODO |
| C1.8 | Context panels: Text, Photo, Color, Event, Bank | `components/invitation/editor/context-panels/` | ⬜ TODO |
| C1.9 | `AddSectionPanel.tsx` — block picker UI | `components/invitation/editor/AddSectionPanel.tsx` | ⬜ TODO |
| C1.10 | Undo/Redo system (`useEditorHistory` hook, immer, 20 steps) | `hooks/useEditorHistory.ts` | ⬜ TODO |
| C1.11 | `InvitationData` migration: `sectionOrder`, `sectionVisibility` | `types.ts` | ⬜ TODO |
| C1.12 | Wire vào App.tsx — thay InvitationManager bằng InvitationEditorPage | `App.tsx` | ⬜ TODO |

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
| 4 | Secure foundation | 3 | 1 | in_progress |
| 5 | Reliable data and RSVP | 2 | 0 | planned |
| 6 | Editor and release validation | 2 | 0 | planned |
