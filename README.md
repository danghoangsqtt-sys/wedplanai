# WedPlan AI

![Version 2.2.1](https://img.shields.io/badge/Version-2.2.1-blue)

Ứng dụng lập kế hoạch cưới: quản lý khách mời, ngân sách, quy trình, thiệp điện tử, RSVP và tư vấn AI.

Phiên bản 2.2.1 sửa các lỗi được ghi nhận trong audit: phân quyền, đồng bộ dữ liệu, backup, RSVP và trình chỉnh sửa thiệp. **Bản nâng cấp cần áp dụng SQL, liên kết tài khoản chủ sở hữu và cấu hình Edge Function theo [SETUP.md](SETUP.md) trước khi sử dụng với backend thật.**

## Chạy dự án

Yêu cầu Node.js `^22.12.0`, `^24.0.0` hoặc `>=26.0.0` theo `package.json` (CI dùng Node 24).

```sh
npm ci
```

Sao chép `.env.example` thành `.env.local`, điền URL và public key Supabase, rồi hoàn thành hướng dẫn database/Auth trong [SETUP.md](SETUP.md).

```sh
npm run dev
```

Mở `http://localhost:3000`. Nếu chưa cấu hình máy chủ, ứng dụng hiển thị trạng thái cần thiết lập; build vẫn có thể kiểm tra offline.

## Cách hoạt động

- Chủ sở hữu đăng nhập bằng Supabase Auth. Database kiểm tra quyền cho từng truy vấn; cờ trình duyệt hoặc PIN cũ không cấp quyền truy cập.
- Thiệp công khai dùng `/?view=invitation&uid=PLAN_UID`. Khách xem thiệp và gửi phản hồi mà không cần tài khoản; số điện thoại RSVP và email không thuộc dữ liệu lời chúc công khai.
- Tự lưu phân biệt thay đổi trên thiết bị với dữ liệu đã được cloud xác nhận. Khi có xung đột giữa thiết bị, ứng dụng giữ bản cục bộ và yêu cầu chọn bản muốn giữ.
- Backup phiên bản 2 chứa khách, ngân sách, quy trình, thiệp, phong thủy và ngày cưới. Backup cũ giữ lại các phần không có trong file, thay vì đặt về mặc định.
- Gemini key hệ thống chỉ nằm trong Edge Function. Key cá nhân do chủ sở hữu nhập được ưu tiên khi có; không đưa key hệ thống vào biến `VITE_*`.

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
