# WedPlan AI — ROADMAP
Version: 1.0.0
Updated: 2026-06-15

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
