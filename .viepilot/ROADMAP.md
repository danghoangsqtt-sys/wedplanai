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
