# Kết quả xử lý audit — WedPlan AI 2.2.1

Ngày: 2026-11-03. Baseline: `2eaafe7`. Nhánh: `fix/audit-2026-11-03`.

20 phát hiện đã có bản sửa mã nguồn hoặc tài liệu tương ứng. Kế hoạch gồm 7 task trong 3 phase: nền tảng bảo mật, dữ liệu/RSVP, editor và kiểm tra phát hành. Báo cáo audit ban đầu và các vị trí dòng cũ được giữ làm lịch sử, không phải kết quả quét hiện tại.

**Trạng thái triển khai:** chưa áp dụng thay đổi lên Supabase thật, chưa triển khai Edge Function và chưa xác minh quyền trên môi trường production. Các bản sửa database/Auth/AI chỉ có hiệu lực trên backend sau khi hoàn thành [SETUP.md](../../SETUP.md). Không có key thật được dùng trong kiểm thử; không có tuyên bố key cũ đã được rotate.

## Đối chiếu từng phát hiện

| ID | Bản sửa | Bằng chứng |
|---|---|---|
| A01 | Supabase Auth xác minh người dùng; ánh xạ chủ sở hữu plan cũ; RLS chặn anon/different user đọc hoặc sửa dữ liệu riêng; lời chúc công khai dùng projection không phone/email | `tests/security.test.tsx`, `tests/database.test.ts` |
| A02 | Tạo đủ bảng trước policy; gỡ policy/FK trước đổi UUID sang TEXT; thay signup trigger tương thích; hai SQL cùng nội dung | PostgreSQL/PGlite: cài mới, chạy lại, nâng cấp UUID/FK/policy, tạo Auth profile |
| A03 | Migration transaction dùng ALTER/CREATE IF NOT EXISTS; không DROP TABLE dữ liệu ứng dụng | PostgreSQL/PGlite giữ nguyên dữ liệu private/public qua upgrade và chạy lại |
| A04 | Lỗi đọc khóa ghi; cache dirty không bị ghi đè; sync tuần tự và exact revision; conditional upsert kiểm tra lại revision khi insert xung đột | `tests/persistence.test.ts`, `tests/database.test.ts`: first save, stale save, save sau xóa và rollback khi lỗi database; chưa chạy concurrency nhiều session |
| A05 | Cột `selected_event_ids` và email; map DTO đầy đủ; RPC kiểm tra/ghi/ack | `tests/cloudService.test.ts`, PostgreSQL lưu/đọc lại danh sách event |
| A06 | Save editor chờ cloud ack; lỗi hiển thị; RSVP/wish await, giữ form và retry; ID ổn định tránh gửi trùng | `tests/rsvp.test.tsx`, `tests/cloudService.test.ts`, SQL idempotency và 2 browser smoke |
| A07 | Backup schema 2 chứa đủ plan; validate trước restore; field thiếu trong backup cũ giữ dữ liệu hiện tại | `tests/backup.test.ts`, `tests/persistence.test.ts` |
| A08 | Nhận diện nội dung do editor tự ghi thay vì object reference; giữ Undo/Redo qua autosave | `tests/editor.test.tsx`, desktop browser smoke |
| A09 | Registry chung chuẩn hóa order/visibility; thứ tự DOM và hidden áp dụng cả public/editor | `tests/editor.test.tsx`, mobile browser smoke |
| A10 | InlineRichText thực sự editable; commit blur/IME; paste text; whitelist HTML/style typography | `tests/editor.test.tsx`, `tests/sanitize.test.ts`, desktop browser smoke |
| A11 | Luồng AI dùng custom key đã lưu khi có, còn lại gọi Edge Function | `tests/ai.test.ts` |
| A12 | `invitation.date` là nguồn chuẩn; alias settings/user và cloud được đồng bộ | `tests/persistence.test.ts` |
| A13 | Guest giữ `partySize` và `sourceRsvpId`; import đủ người, dedup, tổng số và dự toán theo party size | `tests/guests.test.tsx` |
| A14 | Bỏ mọi injection system key khỏi Vite; server xác minh token/plan, Origin, payload và quota database; không phản chiếu lỗi chứa secret | `tests/ai.test.ts`, `tests/build.test.ts`, SQL quota, Deno typecheck |
| A15 | Cập nhật dependency tương thích và lockfile, override bản vá transitive | `dependency-audit-final.json`: 0 affected packages/advisories tại thời điểm kiểm tra |
| A16 | Scripts typecheck/lint/test/build/check; ESLint dependencies; CI chất lượng, Deno và Chromium smoke | `npm run check`, `.github/workflows/quality.yml`; CI được cấu hình, chưa suy diễn kết quả remote |
| S01 | Đồng bộ ROADMAP/TRACKER/HANDOFF, task/phase 4–6; phân biệt milestone lịch sử và deployment pending | File trạng thái và task contract; FEAT-001/002 giữ backlog |
| S02 | Checkpoint mới theo milestone/task; tag lịch sử gắn đúng commit đã khai báo hoàn thành, annotation nêu giới hạn xác minh | `wedplanai-legacy-canvas-vp-p1-complete` → `08f7cad`; `wedplanai-legacy-invitation-vp-p3-complete` → `9121d88`; đối chiếu cả local/remote |
| D01 | Viết lại setup Supabase/Auth/RLS/storage/Edge Function; `.env.example` không secret; trạng thái thiếu config rõ ràng | README/SETUP đối chiếu `lib/supabase.ts`, SQL, Edge Function và script hiện tại |
| D02 | Changelog 2.2.1 và ghi bổ sung lịch sử 2.2.0 theo git | CHANGELOG khớp manifest; lịch sử không được coi là deploy đã xác minh |

## Kết quả xác minh

- `npm run check`: typecheck, lint, **61 test trong 11 file**, production build.
- PostgreSQL/PGlite: **16 test**, có quyền owner/anon/other, projection lời chúc, retry idempotent, preserving upgrade, stale revision, first save/rollback, sharing, quota, signup trigger và restrictive storage policy.
- Chrome headless: **2/2** desktop editor và mobile public RSVP, backend giả lập; không lỗi JavaScript và mobile không đọc dữ liệu riêng. Ảnh kiểm tra nằm trong `test-results/` (gitignored).
- `npm audit`: **0** info/low/moderate/high/critical, gồm cả dev dependencies; đây là ảnh chụp theo thời điểm, không bảo đảm dependency không có lỗi chưa được công bố.
- `deno check supabase/functions/gemini/index.ts`: đạt.
- Kiểm thử bundle dùng sentinel key giả, xác nhận không bị đóng gói vào JavaScript công khai.

## Triển khai còn lại

1. Backup database và giữ nguyên plan UID/URL thiệp; chạy toàn bộ migration trong môi trường thử trước.
2. Áp dụng migration, tạo/chọn tài khoản Auth và liên kết `private.plan_owners` đúng tài khoản thực.
3. Cấu hình storage `wedkho` và public URL; dữ liệu file cũ giữ nguyên đường dẫn, upload mới dùng thư mục plan UID.
4. Đặt secret Gemini/allowed origins/owner plan trên Supabase, deploy function và frontend với public config phù hợp.
5. Kiểm tra thực tế owner login/save/refresh, anon deny, RSVP/wish, upload và AI theo checklist SETUP. Nếu system key từng nằm trong bundle cũ, xử lý key tại nhà cung cấp theo môi trường thực.

PGlite chạy PostgreSQL thật trong bộ nhớ nhưng không thay thế PostgREST/Auth/Storage/Edge gateway của Supabase. Browser smoke dùng API giả lập, nên không chứng minh production đã hoạt động. Test AI không phát sinh chi phí Gemini. Các feature mở rộng và cải tổ toàn bộ lint legacy nằm ngoài phạm vi; lint gate hiện bảo vệ lỗi, còn quy tắc legacy unused/any ở mức warning.

## Truy vết

- [Kế hoạch phase 4](../phases/audit-phase-4/SPEC.md), [phase 5](../phases/audit-phase-5/SPEC.md), [phase 6](../phases/audit-phase-6/SPEC.md).
- [Audit baseline](../audit-report.md), [findings gốc](findings.json), [ánh xạ request](autolog-index.json).
- [Kiến trúc hiện tại](../ARCHITECTURE.md), [handoff](../HANDOFF.json).
- Harness `reproduce-audit.cjs` chỉ dành cho baseline 2.2.0, chủ động từ chối chạy trên phiên bản mới để tránh ghi đè bằng chứng cũ. Regression hiện tại dùng test suite và browser smoke ở trên.
