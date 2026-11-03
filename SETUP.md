# Thiết lập WedPlan AI 2.3.1

Mặc định dùng **PIN cá nhân** theo yêu cầu chủ sở hữu để dùng thử cùng vợ, chưa yêu cầu đăng nhập tài khoản. Chạy `npm ci` rồi `npm run dev`, nhập PIN đã chọn. Không cần cấu hình Supabase cho cách dùng này; dữ liệu lưu tại trình duyệt, nút Lưu thông báo lưu trên thiết bị. Cùng PIN trên hai máy chưa tạo đồng bộ dữ liệu giữa hai máy; xuất/nhập backup để chuyển bản kế hoạch khi chưa có cloud.

`VITE_ACCESS_MODE=pin` là mặc định; `VITE_ACCESS_MODE=account` mới bật màn hình email/mật khẩu. PIN chỉ khóa giao diện, không phải credential database. Một phiên cloud có sẵn chỉ được dùng sau khi xác minh quyền; không có phiên đó thì vẫn vào app cục bộ bình thường.

Các bước dưới đây dành cho **cloud tùy chọn**. Backend dùng Supabase, không dùng Appwrite; biến `VITE_APPWRITE_*` cũ không phù hợp. Không mở rộng policy sang anon để khiến PIN thành quyền truy cập dữ liệu riêng.

## 1. Cấu hình frontend

1. Tạo hoặc chọn project Supabase.
2. Sao chép `.env.example` thành `.env.local` ở thư mục gốc.
3. Điền `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` bằng URL/public anon hoặc publishable key của project. **Không dùng service-role/secret key trong frontend.**
4. Khi nâng cấp dữ liệu cũ, giữ `VITE_OWNER_UID=e8a57bf1-58c2-45ae-b1ab-65c1e6921ad9`. Đây là ID kế hoạch công khai, không phải mật khẩu.

Nếu dùng ID kế hoạch khác, ID đó phải trùng giữa frontend, owner mapping và secret `OWNER_PLAN_UID` của Edge Function. Chỉ thay ID khi đã có kế hoạch chuyển dữ liệu tương ứng.

## 2. Cài mới hoặc nâng cấp database

Trước khi nâng cấp một project đang có dữ liệu, xuất backup ứng dụng và snapshot database. Giữ bản snapshot nếu cần quay lại phiên bản cũ.

Chạy **toàn bộ** `supabase-migration.sql` trong SQL Editor của project, dưới quyền quản trị. File có `BEGIN/COMMIT`, dùng được cho cài mới và nâng cấp:

- Tạo các bảng trước khi tạo policy phụ thuộc.
- Bỏ policy cũ trước khi đổi kiểu khóa UUID sang TEXT, giữ nguyên giá trị ID và nội dung bản ghi.
- Thêm `selected_event_ids`, email riêng và các RPC cho lưu/retry phản hồi.
- Giới hạn dữ liệu riêng theo tài khoản chủ sở hữu/thành viên. Lời chúc công khai được đọc qua projection không có phone/email.
- Thay trigger tạo profile bằng phiên bản tương thích TEXT và `search_path` cố định.
- Cài quota AI và policy Storage cho thư mục của kế hoạch.
- Thêm `user_data.milestone_tasks` và cập nhật `save_plan` để lưu lộ trình dashboard. Frontend chọn rõ cột này khi đọc: schema cũ sẽ báo lỗi và khóa ghi thay vì báo lưu thành công nhưng bỏ mất checklist.

`supabase-fix-public-invitations.sql` hiện chứa cùng migration an toàn để tương thích đường dẫn cũ. **Không dùng nội dung DROP TABLE của script lịch sử.** Không cần chạy cả hai file; việc chạy lại migration đã được kiểm tra không xóa bản ghi hiện có.

Nếu đã triển khai 2.2.1, vẫn phải chạy lại file SQL hiện tại trước khi deploy 2.3.0. Cột mới nullable giúp phân biệt plan cũ chưa chuyển checklist và plan đã lưu checklist rỗng. Client cũ bỏ qua trường mới không xóa checklist đã lưu. Checklist chỉ có trong `wedplan_ms_tasks_v2` sẽ được nhập một lần trên trình duyệt cũ sau khi xác minh cloud; hãy mở đúng trình duyệt trước khi xóa cache. Checklist đã có trên cloud được ưu tiên.

Sau khi chạy, so sánh số bản ghi và nội dung mẫu ở `user_data`, `public_invitations` với snapshot trước nâng cấp. Database có schema hoặc dependency được sửa riêng ngoài repo cần được thử bằng bản sao trước khi áp dụng.

## 3. Tạo tài khoản và cấp quyền chủ sở hữu

Tạo tài khoản email/mật khẩu trong Supabase Auth cho người quản lý. Với công cụ cá nhân, chỉ cấp tài khoản cần thiết và tắt đăng ký công khai nếu không có nhu cầu.

Với dữ liệu cũ, tài khoản Auth mới có thể khác UUID kế hoạch. Cấp quyền bằng owner mapping, không sửa ID thiệp đã chia sẻ. Trong SQL Editor, thay email mẫu bằng email vừa tạo:

```sql
INSERT INTO private.plan_owners(plan_uid, auth_user_id)
SELECT 'e8a57bf1-58c2-45ae-b1ab-65c1e6921ad9', id
FROM auth.users
WHERE email = 'owner@example.com'
ON CONFLICT(plan_uid) DO UPDATE SET auth_user_id = EXCLUDED.auth_user_id;

SELECT plan_uid, auth_user_id
FROM private.plan_owners
WHERE plan_uid = 'e8a57bf1-58c2-45ae-b1ab-65c1e6921ad9';
```

Phải có đúng tài khoản mong muốn trong kết quả. Nếu không có hàng nào, kiểm tra email; không mở rộng policy sang `anon` để vượt lỗi đăng nhập.

Ứng dụng gọi `auth.getUser()` và RPC `can_manage_plan` trước khi tải dữ liệu riêng. Phiên đăng nhập giả/cờ `wedplan_unlocked` cũ không có tác dụng cấp quyền.

Nếu kế hoạch mới dùng chính Auth user ID làm plan UID thì quyền sở hữu trực tiếp được hỗ trợ. Đường dẫn này không tự di chuyển dữ liệu cũ sang ID mới.

## 4. Storage ảnh

Tạo bucket `wedkho`. Thiết lập public read nếu cần ảnh xuất hiện trong thiệp công khai; giới hạn kích thước 2 MB và loại MIME ảnh phù hợp.

Ảnh mới được ghi dưới `PLAN_UID/...`, avatar dưới `PLAN_UID/avatars/...`. Migration đặt thêm restrictive policy: policy rộng còn sót lại không được phép mở quyền ghi vào thư mục kế hoạch không thuộc tài khoản.

Không tự đổi bucket private thành public khi chưa rà nội dung đang có. Nếu bucket cũ private, code có signed URL fallback; cần kiểm tra đường dẫn ảnh trên thiết bị khách trước khi chia sẻ thiệp. Migration không tạo/chuyển trạng thái bucket thay người quản trị.

## 5. Gemini AI

### Key cá nhân

Sau khi mở app bằng PIN hoặc đăng nhập ở chế độ account, vào Cài Đặt, nhập và kiểm tra key Gemini. Key cá nhân được dùng cho các lời gọi AI của tài khoản trên thiết bị đó. Backup không xuất key hay phiên Auth. Không chia sẻ key cá nhân qua file backup.

### Key hệ thống qua Edge Function

Đặt các secret phía máy chủ:

| Secret | Giá trị |
|---|---|
| `GEMINI_API_KEY` | Key Gemini hệ thống |
| `OWNER_PLAN_UID` | Plan UID đã cấp quyền |
| `ALLOWED_ORIGINS` | Origin chính xác, cách nhau bằng dấu phẩy |
| `GEMINI_TEXT_MODEL` | Tùy chọn, mặc định `gemini-2.5-flash` |
| `GEMINI_IMAGE_MODEL` | Tùy chọn, mặc định `gemini-2.5-flash-image` |

Ví dụ origin: `https://your-project.vercel.app,http://localhost:3000`. Khi tên miền thay đổi, cập nhật danh sách tương ứng. Chọn model đang được project Gemini cho phép sử dụng.

Supabase cung cấp `SUPABASE_URL` và `SUPABASE_ANON_KEY` cho runtime Edge. Dùng Supabase CLI đã đăng nhập tài khoản có quyền project:

```sh
supabase secrets set --project-ref PROJECT_REF --env-file supabase/.env.local
supabase functions deploy gemini --project-ref PROJECT_REF
```

File secret `supabase/.env.local` tự tạo không được commit. Đặt các secret trong bảng trên vào file này, không đặt key hệ thống trong `VITE_*`. Có thể quản lý secrets bằng chức năng tương ứng trong Supabase thay cho CLI.

`verify_jwt=false` trong config nhằm tương thích JWT signing key mới; handler **vẫn tự xác minh JWT bằng Auth server, kiểm tra quyền plan cố định và quota trước mỗi yêu cầu AI**. Quota dùng database: 10 yêu cầu/phút, 200/ngày cho mỗi tài khoản, tính cả lần provider thất bại sau khi đã dành quota.

Nếu đã từng deploy `VITE_GEMINI_API_KEY`, bỏ biến đó khỏi cấu hình frontend và thay key cũ trước khi dùng key hệ thống mới. Static bundle cũ có thể vẫn còn trong cache. Key cá nhân được nhập chủ động tại trình duyệt là luồng riêng, không phải system key.

Tài liệu chính thức: [Edge secrets](https://supabase.com/docs/guides/functions/secrets), [JWT/Auth trong Edge Function](https://supabase.com/docs/guides/functions/auth), [Vite environment variables](https://vite.dev/guide/env-and-mode).

## 6. Chạy và triển khai frontend

```sh
npm ci
npm run dev
```

Mở `http://localhost:3000` và nhập PIN để dùng cục bộ. Nếu chủ động bật chế độ account/cloud, đăng nhập và kiểm tra dữ liệu cloud trước khi sửa. Nút Lưu chỉ báo đã lưu cloud sau khi có xác nhận. Khi đọc cloud lỗi, tự động ghi bị khóa; thay đổi cục bộ vẫn được giữ. Khi xung đột phiên bản, xuất backup trước khi bấm dùng bản cloud.

```sh
npm run check
npm run test:e2e
npm audit
```

E2E cần `npx playwright install chromium`, hoặc Chrome đã cài và `PLAYWRIGHT_CHANNEL=chrome`. Tests không cần credentials thật. Có thể kiểm tra Edge bằng `deno check supabase/functions/gemini/index.ts`.

Triển khai Vercel: build `npm run build`, output `dist`, điền ba biến public trong `.env.example` và dùng SPA rewrite trong `vercel.json`. Không cần đưa system Gemini key lên frontend host.

Trình tự nâng cấp: backup → thử SQL trên bản sao → áp dụng SQL và owner mapping → cấu hình/deploy Edge nếu dùng AI hệ thống → deploy frontend → kiểm tra owner và một thiết bị khách không đăng nhập.

## 7. Kiểm tra sau triển khai

- Tài khoản được cấp quyền tải được dữ liệu cũ; tài khoản khác và khách không đọc/sửa được `user_data`.
- Trên thiết bị khách, mở thiệp công khai, xác nhận RSVP, gửi lời chúc; phía owner đọc đúng sự kiện và số người.
- Khách không đọc được bảng phản hồi riêng. RPC lời chúc công khai chỉ có `id`, `name`, `message`, `created_at`.
- Kiểm tra ảnh, AI và lưu thiệp bằng một lần thành công và một lần mất kết nối.
- Xuất/nhập backup giữ nguyên thiệp, quy trình và ngày cưới; thử lại không tạo RSVP trùng.

Các kiểm tra offline trong repo không xác nhận SQL/secrets đã được áp dụng cho project Supabase thật. Xem [kết quả remediation](.viepilot/audit/remediation-report.md) để biết bằng chứng và phần triển khai còn cần cấu hình.
