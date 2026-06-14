# Phase 2 — RSVP & Guestbook Cloud Collection

**Status:** ✅ CODE COMPLETE (tsc ✓ / build ✓) — ⚠️ pending one-time SQL migration to go live
**Started:** 2026-06-15
**Completed (code):** 2026-06-15
**Plan source:** `docs/brainstorm/session-2026-06-15-invitation-upgrade.md` → Phase 2

## Result
- `lib/supabase.ts` ✅ `INVITATION_RESPONSES` added
- `services/cloudService.ts` ✅ `submitRSVP` / `submitWish` / `loadInvitationResponses` (graceful)
- `PublicInvitationView.tsx` ✅ RSVP + wishes now persist to cloud; wishes loaded from cloud + deduped
- `InvitationManager.tsx` ✅ "Phản Hồi Khách Mời" owner panel (RSVP list + wishes + counts)
- Version → 1.2.0; CHANGELOG updated

## Remaining (user action)
Run the `invitation_responses` migration SQL (session doc) in Supabase SQL Editor → data starts flowing. No further code needed.

## Objective
Khách gửi RSVP + lời chúc → lưu cloud thật; cô dâu chú rể xem được trong app. Sửa C1 (RSVP bị vứt bỏ) + C2 (lời chúc chỉ localStorage).

## Paths
- `lib/supabase.ts` — thêm `INVITATION_RESPONSES` vào TABLES
- `services/cloudService.ts` — thêm `submitRSVP`, `submitWish`, `loadInvitationResponses` (graceful: catch lỗi → trả default nếu bảng chưa tồn tại)
- `components/invitation/PublicInvitationView.tsx` — RSVPModal.onSubmit → `submitRSVP`; `handleWishSubmit` → `submitWish`; load wishes từ cloud khi mount
- `components/invitation/InvitationManager.tsx` — section "Phản Hồi Khách Mời" hiển thị RSVP + lời chúc cho owner

## File-Level Plan
1. **supabase.ts**: `INVITATION_RESPONSES: 'invitation_responses'`
2. **cloudService.ts**: interface `InvitationResponse` + 3 async fn, tất cả try/catch trả `[]`/`false` khi lỗi (bảng chưa có → degrade an toàn, không crash)
3. **PublicInvitationView.tsx**: RSVPModal nhận prop `onSubmit`; submit optimistic (hiện success dù cloud lỗi); merge cloud wishes + local + legacy, dedupe theo id
4. **InvitationManager.tsx**: SectionToggle `RESPONSES`, load khi expand, hiện danh sách + đếm

## Best Practices
- Anon insert qua RLS policy (đã định nghĩa SQL trong session doc) — **cần user chạy migration trước khi data thật chảy về**
- Graceful degradation: code không crash khi bảng chưa tồn tại
- Giữ localStorage làm offline cache cho wishes (không phá hành vi cũ)

## Verification
- `npx tsc --noEmit` → 0 errors
- `npx vite build` → pass
- Manual: submit RSVP/wish ở public view không crash khi bảng chưa có (fail im lặng, UI vẫn báo thành công)

## ⚠️ External dependency
Bảng `invitation_responses` + RLS phải chạy trong Supabase SQL Editor (SQL ở session doc) thì data mới thật sự được thu thập. Code an toàn cả khi chưa chạy.
