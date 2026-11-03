# WedPlan AI

![Version 2.3.1](https://img.shields.io/badge/Version-2.3.1-blue)

Ứng dụng lập kế hoạch cưới: quản lý khách mời, ngân sách, quy trình, thiệp điện tử, RSVP và tư vấn AI.

Phiên bản 2.3.0 bổ sung hồ sơ khách mời, bộ lọc, tổng quan bàn tiệc và sửa lưu lộ trình dashboard. Kế thừa các bản sửa audit 2.2.1 về phân quyền, đồng bộ, backup, RSVP và editor. **Cần áp dụng SQL hiện tại theo [SETUP.md](SETUP.md) trước khi dùng frontend mới với backend thật**, kể cả khi đã chạy SQL 2.2.1.

## Chạy dự án

Yêu cầu Node.js `^22.12.0`, `^24.0.0` hoặc `>=26.0.0` theo `package.json` (CI dùng Node 24).

```sh
npm ci
```

Mặc định dùng PIN cá nhân đã được chủ sở hữu thiết lập. Không cần `.env.local` hay tài khoản Supabase để sử dụng và lưu trên trình duyệt. Khi muốn dùng cloud, cấu hình public Supabase theo [SETUP.md](SETUP.md); không cần làm bước đó để thử app cục bộ.

```sh
npm run dev
```

Mở `http://localhost:3000`, nhập PIN để vào ứng dụng. Phiên mở giữ trong tab; chọn “Khóa ứng dụng” để hỏi PIN lại. Dữ liệu đã lưu không bị xóa khi khóa.

## Cách hoạt động

- Bản 2.3.1 khôi phục PIN làm cách vào web mặc định theo yêu cầu dùng cá nhân của chủ sở hữu. PIN là khóa giao diện trình duyệt; database vẫn kiểm tra quyền độc lập. Chỉ bật `VITE_ACCESS_MODE=account` khi muốn yêu cầu email/mật khẩu.
- Không có cấu hình/phiên cloud hợp lệ thì app lưu trên thiết bị và báo đúng trạng thái đó. Hai trình duyệt/thiết bị chưa tự đồng bộ chỉ nhờ nhập cùng PIN; có thể xuất/nhập backup để chuyển dữ liệu. PIN không tự xuất bản thiệp lên backend.
- Nếu đã có phiên cloud, app chỉ dùng phiên đó sau khi Auth server và quyền plan được xác minh. Không có account sign-in tự động hoặc credentials nhúng trong frontend.
- Lộ trình dashboard dùng chung lưu cục bộ, cloud revision và backup; checklist cũ tự chuyển sau khi tải cloud thành công. Mục đã xóa và ghi chú được giữ nguyên.
- Khách mời có điện thoại, địa chỉ, số người/trẻ em, gửi thiệp, phản hồi, bàn và ghi chú; lọc/tìm kiếm/CSV theo danh sách đang xem. Gửi thiệp và xác nhận tham dự là hai trạng thái riêng.
- Thiệp công khai dùng `/?view=invitation&uid=PLAN_UID`. Khách xem thiệp và gửi phản hồi mà không cần tài khoản; số điện thoại RSVP và email không thuộc dữ liệu lời chúc công khai.
- Tự lưu phân biệt thay đổi trên thiết bị với dữ liệu đã được cloud xác nhận. Khi có xung đột giữa thiết bị, ứng dụng giữ bản cục bộ và yêu cầu chọn bản muốn giữ.
- Backup phiên bản 2 chứa khách, ngân sách, quy trình, thiệp, phong thủy và ngày cưới. Backup cũ giữ lại các phần không có trong file, thay vì đặt về mặc định.
- Gemini key hệ thống chỉ nằm trong Edge Function. Key cá nhân do chủ sở hữu nhập được ưu tiên khi có; không đưa key hệ thống vào biến `VITE_*`.

## Xem thử tại máy khi chưa có Supabase

```sh
node .viepilot/tools/local-preview.cjs
```

Cần Chrome đã cài và cổng 3000 còn trống. Công cụ mở một cửa sổ Chrome riêng tại `http://127.0.0.1:3000`, dùng API giả lập và dữ liệu mẫu; quyền cloud production vẫn yêu cầu Auth thật. Thay đổi mẫu giữ trong phiên xem thử, không ghi Supabase. Đóng cửa sổ này để kết thúc; không dùng bản mẫu để lưu dữ liệu đám cưới thật. Để sử dụng dữ liệu cá nhân cục bộ, dùng `npm run dev` thông thường.

Nếu máy chủ thường đang dùng cổng 3000, chạy `node .viepilot/tools/local-preview.cjs --port 3001` để mở bản mẫu ở cổng riêng.

Kế hoạch ngân sách cọc/thanh toán nhiều đợt/còn phải trả: [phase 8](.viepilot/phases/planning-phase-8/SPEC.md). Phần này mới lập kế hoạch, chưa triển khai.

## Kiểm tra

```sh
npm run check
npm audit
```

`check` chạy typecheck, lint, test và build. Các test database dùng PostgreSQL/PGlite trong bộ nhớ; test React và API dùng dữ liệu giả lập.

```sh
npx playwright install chromium
npm run test:e2e
```

Trên PowerShell có Chrome sẵn, có thể đặt `$env:PLAYWRIGHT_CHANNEL='chrome'` trước khi chạy E2E. Smoke test khởi động server ở cổng 3017 với cấu hình giả và chặn request Supabase bằng mock, không dùng dữ liệu production.

Edge Function được kiểm tra riêng:

```sh
deno check supabase/functions/gemini/index.ts
```

## Cấu trúc

| Đường dẫn | Vai trò |
|---|---|
| `App.tsx`, `components/` | Giao diện và các màn hình nghiệp vụ |
| `store/useStore.ts` | Trạng thái cục bộ, hàng đợi lưu, revision và phục hồi |
| `services/` | Supabase, AI và nghiệp vụ |
| `lib/` | Backup, thống kê khách, section rendering và bộ lọc nội dung |
| `supabase-migration.sql` | Cài mới/nâng cấp database không xóa bảng dữ liệu |
| `supabase/functions/gemini/` | AI phía máy chủ có Auth, phân quyền và quota |
| `tests/` | Kiểm tra hành vi, SQL, bảo mật và trình duyệt |
| `.viepilot/` | Kế hoạch, bằng chứng audit và trạng thái sửa lỗi |

Chi tiết thay đổi: [CHANGELOG.md](CHANGELOG.md). Kết quả sửa audit: [remediation-report.md](.viepilot/audit/remediation-report.md).
