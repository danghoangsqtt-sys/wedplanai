# 🛠️ Hướng Dẫn Cấu Hình WedPlan AI

> Tài liệu này hướng dẫn chi tiết cách thiết lập toàn bộ backend (Appwrite), AI (Gemini), và deploy (Vercel) cho dự án WedPlan AI.

---

## Mục Lục

1. [Tổng Quan Kiến Trúc](#1-tổng-quan-kiến-trúc)
2. [Tạo Project Appwrite](#2-tạo-project-appwrite)
3. [Cấu Hình Authentication](#3-cấu-hình-authentication)
4. [Tạo Database & Collections](#4-tạo-database--collections)
5. [Thiết Lập Indexes](#5-thiết-lập-indexes)
6. [Cấu Hình Permissions](#6-cấu-hình-permissions)
7. [Tạo Storage Bucket](#7-tạo-storage-bucket)
8. [Cấu Hình Environment Variables](#8-cấu-hình-environment-variables)
9. [Chạy Local](#9-chạy-local)
10. [Deploy Lên Vercel](#10-deploy-lên-vercel)
11. [Luồng Hoạt Động (Usage Flow)](#11-luồng-hoạt-động-usage-flow)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Tổng Quan Kiến Trúc

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React + Vite  │────▶│  Appwrite Cloud  │     │  Google Gemini  │
│   (Frontend)    │     │  (Auth + DB +     │     │  (AI Service)   │
│                 │     │   Storage)        │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                                               │
        └───────────────────────────────────────────────┘
                        Direct API Call
```

- **Frontend**: React 19 + Vite 6 + TailwindCSS 4 + TypeScript
- **Backend**: Appwrite Cloud (BaaS) — xử lý Auth, Database, Storage
- **AI**: Google Gemini 2.5 Flash — tư vấn cưới, tạo sticker
- **Deploy**: Vercel (SPA mode)

---

## 2. Tạo Project Appwrite

1. Truy cập [cloud.appwrite.io](https://cloud.appwrite.io) → đăng ký / đăng nhập
2. Nhấn **"Create Project"**
3. Đặt tên project (VD: `WedPlan AI`), chọn region **Singapore** (`sgp`) cho tốc độ tốt nhất với user Việt Nam
4. Lưu lại **Project ID** (VD: `wedplanai`)

### Thêm Web Platform

5. Vào **Settings → Platforms → Add Platform → Web**
6. Thêm các hostname được phép:
   - `localhost` (cho development)
   - `your-app.vercel.app` (cho production)
   - Bất kỳ custom domain nào bạn sử dụng

---

## 3. Cấu Hình Authentication

### Bật Google OAuth

1. Vào **Auth → Settings → OAuth2 Providers**
2. Tìm **Google** → bật lên
3. Bạn cần tạo OAuth credentials từ [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Tạo project mới (hoặc dùng project có sẵn)
   - Vào **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Chọn **Web application**
   - Thêm vào **Authorized redirect URIs**: copy URI mà Appwrite hiển thị (dạng `https://sgp.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/...`)
   - Copy **Client ID** và **Client Secret** dán vào Appwrite

### Cách Login hoạt động

> **Lưu ý UX**: Login dùng **redirect** thay vì popup.

```
User nhấn "Tiếp tục với Google"
    → Browser redirect sang trang Google
    → User chọn tài khoản Google
    → Google redirect về app (origin URL)
    → App.tsx useEffect initSession() tự detect session mới
    → Load/tạo profile → Đăng nhập thành công
```

- **Success URL**: `{origin}/` — redirect về trang chủ
- **Failure URL**: `{origin}/?auth_error=1` — hiển thị toast lỗi

---

## 4. Tạo Database & Collections

### Tạo Database

1. Vào **Databases → Create Database**
2. Đặt tên (VD: `WedData`), lưu lại **Database ID** (VD: `weddata`)

### Tạo 5 Collections

> ⚠️ **QUAN TRỌNG**: Collection ID phải đúng chính xác như bên dưới (code hardcode các ID này).

---

### 4.1. Collection: `user_data`

**Mục đích**: Lưu toàn bộ dữ liệu cưới của mỗi user (khách mời, ngân sách, quy trình, phong thủy, thiệp mời). Mỗi document = 1 user. Document ID = User's Appwrite UID.

| Attribute Key      | Type      | Size      | Required | Default | Ghi chú                           |
|--------------------|-----------|-----------|----------|---------|-----------------------------------|
| `userId`           | String    | 50        | ✅       | —       | Appwrite User ID                  |
| `guests_json`      | String    | 500000    | ❌       | `[]`    | JSON array danh sách khách mời    |
| `budget_json`      | String    | 500000    | ❌       | `[]`    | JSON array danh sách ngân sách    |
| `procedures_json`  | String    | 500000    | ❌       | `{}`    | JSON object quy trình theo vùng   |
| `fengshui_json`    | String    | 100000    | ❌       | `null`  | JSON profile phong thủy cặp đôi  |
| `results_json`     | String    | 100000    | ❌       | `null`  | JSON kết quả phong thủy          |
| `invitation_json`  | String    | 500000    | ❌       | `{}`    | JSON dữ liệu thiệp mời          |
| `lastUpdated`      | Integer   | —         | ❌       | —       | Timestamp (ms) lần sync cuối     |

---

### 4.2. Collection: `public_profiles`

**Mục đích**: Thông tin công khai của user, dùng cho admin quản lý, hiển thị avatar, kiểm tra trạng thái kích hoạt. Document ID = User's Appwrite UID.

| Attribute Key        | Type      | Size  | Required | Default | Ghi chú                              |
|----------------------|-----------|-------|----------|---------|---------------------------------------|
| `uid`                | String    | 50    | ✅       | —       | Appwrite User ID                      |
| `email`              | String    | 150   | ❌       | —       | Email đăng nhập Google                |
| `displayName`        | String    | 100   | ❌       | —       | Tên hiển thị                          |
| `photoURL`           | String    | 500   | ❌       | —       | URL avatar (Google hoặc tự upload)    |
| `role`               | String    | 10    | ❌       | —       | `ADMIN` / `USER` / `GUEST`            |
| `isActive`           | Boolean   | —     | ❌       | `false` | Admin kích hoạt thủ công              |
| `joinedAt`           | String    | 50    | ❌       | —       | ISO date string khi tạo tài khoản    |
| `lastSeen`           | Integer   | —     | ❌       | —       | Timestamp (ms) hoạt động gần nhất    |
| `enableCloudStorage` | Boolean   | —     | ❌       | `true`  | Cho phép đồng bộ dữ liệu lên cloud  |
| `allowCustomApiKey`  | Boolean   | —     | ❌       | `false` | Cho phép nhập Gemini API Key riêng   |

---

### 4.3. Collection: `public_invitations`

**Mục đích**: Lưu thiệp mời công khai — bất kỳ ai có link `?view=invitation&uid=xxx` đều xem được mà không cần đăng nhập. Document ID = User's Appwrite UID.

| Attribute Key      | Type    | Size    | Required | Default | Ghi chú                       |
|--------------------|---------|---------|----------|---------|-------------------------------|
| `uid`              | String  | 50      | ✅       | —       | Appwrite User ID              |
| `invitation_json`  | String  | 500000  | ❌       | `{}`    | JSON đầy đủ dữ liệu thiệp    |

---

### 4.4. Collection: `analytics_logs`

**Mục đích**: Ghi log mỗi lần truy cập app (1 lần/ngày/user). Admin dùng để xem thống kê lượt truy cập, nguồn traffic. Document ID = auto-generated (`ID.unique()`).

| Attribute Key  | Type     | Size  | Required | Default | Ghi chú                            |
|----------------|----------|-------|----------|---------|-------------------------------------|
| `timestamp`    | Integer  | —     | ✅       | —       | `Date.now()` thời điểm truy cập    |
| `uid`          | String   | 50    | ❌       | —       | User ID hoặc `"guest"`              |
| `page`         | String   | 200   | ❌       | —       | `window.location.pathname`          |
| `ip`           | String   | 50    | ❌       | —       | IP công khai (từ ipify.org)         |
| `referrer`     | String   | 500   | ❌       | —       | `document.referrer` hoặc `"direct"` |
| `userAgent`    | String   | 500   | ❌       | —       | Trình duyệt + OS (cắt 500 ký tự)   |

---

### 4.5. Collection: `guest_usage`

**Mục đích**: Giới hạn số lần sử dụng tính năng AI/phong thủy cho user chưa đăng nhập (theo IP). Document ID = IP address (dấu `.` thay bằng `_`, VD: `192_168_1_1`).

| Attribute Key   | Type     | Size | Required | Default | Ghi chú                               |
|-----------------|----------|------|----------|---------|----------------------------------------|
| `ip`            | String   | 50   | ✅       | —       | IP gốc (dạng `192.168.1.1`)           |
| `fengShuiCount` | Integer  | —    | ❌       | `0`     | Số lần dùng tính năng phong thủy      |
| `aiChatCount`   | Integer  | —    | ❌       | `0`     | Số lần chat AI                        |
| `speechCount`   | Integer  | —    | ❌       | `0`     | Số lần dùng tính năng giọng nói       |
| `lastUpdated`   | Integer  | —    | ❌       | —       | Timestamp (ms) cập nhật gần nhất      |

---

## 5. Thiết Lập Indexes

> Indexes giúp Appwrite truy vấn nhanh hơn. **Không có index → query sẽ bị lỗi hoặc rất chậm**.

### 5.1. Collection `public_profiles`

| Index Key           | Type  | Attributes   | Order | Mục đích                           |
|---------------------|-------|--------------|-------|-------------------------------------|
| `idx_lastSeen`      | Key   | `lastSeen`   | DESC  | Sắp xếp user theo hoạt động gần nhất (admin dashboard) |

> Query sử dụng: `Query.orderDesc('lastSeen')`, `Query.limit(100)`

### 5.2. Collection `analytics_logs`

| Index Key           | Type  | Attributes   | Order | Mục đích                           |
|---------------------|-------|--------------|-------|-------------------------------------|
| `idx_timestamp`     | Key   | `timestamp`  | DESC  | Lọc logs theo thời gian (7 ngày gần nhất) |

> Query sử dụng: `Query.greaterThan('timestamp', sevenDaysAgo)`, `Query.limit(500)`

### Các collection còn lại

`user_data`, `public_invitations`, `guest_usage` — **không cần index** vì chỉ dùng `getDocument(docId)` (truy vấn theo Document ID, đã có index tự động).

---

## 6. Cấu Hình Permissions

> ⚠️ Permissions rất quan trọng! Sai permission = app không đọc/ghi được dữ liệu.

### 6.1. Collection `user_data` — Dữ liệu riêng tư

**Collection-level permissions**: Bật **Document Security** (mỗi document tự quản permission)

Code tự gán permission khi tạo document:
```
Read:   Users (role: user:[uid])  — Chỉ chủ sở hữu đọc
Update: Users (role: user:[uid])  — Chỉ chủ sở hữu sửa
Delete: Users (role: user:[uid])  — Chỉ chủ sở hữu xóa
```

### 6.2. Collection `public_profiles` — Profile công khai

**Collection-level permissions**: Bật **Document Security**

```
Read:   Any     — Ai cũng đọc được (admin list, avatar hiển thị)
Update: Users   — User đã đăng nhập có thể cập nhật
Delete: Users   — User đã đăng nhập có thể xóa
```

### 6.3. Collection `public_invitations` — Thiệp mời công khai

**Collection-level permissions**: Bật **Document Security**

```
Read:   Any           — Ai cũng xem được thiệp (chia sẻ link)
Update: Users (owner) — Chỉ chủ sở hữu sửa
Delete: Users (owner) — Chỉ chủ sở hữu xóa
```

### 6.4. Collection `analytics_logs` — Analytics

**Collection-level permissions**: Bật **Document Security**

```
Read:   Users   — User đã đăng nhập đọc (admin dashboard)
Delete: Users   — User đã đăng nhập xóa
Create: Any     — Bất kỳ ai truy cập đều ghi log (kể cả guest)
```

> ⚠️ Cần thêm permission `Create` ở **Collection-level** cho `Any` vì guest (chưa login) cũng cần ghi analytics log.

### 6.5. Collection `guest_usage` — Giới hạn IP

**Collection-level permissions**: Bật **Document Security**

```
Read:   Any     — Đọc để kiểm tra limit
Update: Any     — Cập nhật counter
Delete: Any     — Xóa khi reset
Create: Any     — Tạo mới khi IP lần đầu sử dụng
```

> ⚠️ Collection này cần permission `Any` cho tất cả operations vì guest chưa đăng nhập cũng phải đọc/ghi.

---

## 7. Tạo Storage Bucket

1. Vào **Storage → Create Bucket**
2. Đặt tên (VD: `WedPlan Uploads`)
3. Lưu lại **Bucket ID**
4. **Cấu hình Permissions**:

```
Create: Any     — Cho phép user upload ảnh (avatar, ảnh quy trình)
Read:   Any     — Cho phép xem ảnh đã upload (hiển thị thiệp, avatar)
```

5. **(Tùy chọn)** Cấu hình **Maximum File Size**: `10MB` (đủ cho ảnh)
6. **(Tùy chọn)** Cấu hình **Allowed File Extensions**: `jpg, jpeg, png, gif, webp`

**Cách sử dụng trong app**:
- Upload avatar tại **Cài đặt → Tài khoản**
- Upload ảnh minh họa tại **Quy trình → Chi tiết bước**
- API: `storage.createFile()` → `storage.getFilePreview()` để lấy URL ảnh (có resize tự động)

---

## 8. Cấu Hình Environment Variables

Tạo file `.env.local` tại thư mục gốc project:

```env
# Cấu hình Appwrite — Tạo project tại cloud.appwrite.io
VITE_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_DATABASE_ID=your-database-id
VITE_APPWRITE_BUCKET_ID=your-bucket-id

# Cấu hình AI (Google Gemini) — Lấy tại aistudio.google.com
VITE_GEMINI_API_KEY=your-gemini-api-key
```

| Biến                         | Lấy từ đâu                                  |
|------------------------------|----------------------------------------------|
| `VITE_APPWRITE_ENDPOINT`     | Appwrite Console → Settings → API Endpoint   |
| `VITE_APPWRITE_PROJECT_ID`   | Appwrite Console → Settings → Project ID     |
| `VITE_APPWRITE_DATABASE_ID`  | Databases → click vào database → Database ID |
| `VITE_APPWRITE_BUCKET_ID`    | Storage → click vào bucket → Bucket ID       |
| `VITE_GEMINI_API_KEY`        | [aistudio.google.com](https://aistudio.google.com) → Get API Key |

> ⚠️ File `.env.local` đã được thêm vào `.gitignore` — KHÔNG commit lên Git.

---

## 9. Chạy Local

```bash
# 1. Cài đặt dependencies
npm install

# 2. Chạy dev server
npm run dev

# 3. Mở trình duyệt
# → http://localhost:3000
```

**Tech stack chi tiết**:
- Vite 6 (dev server + bundler)
- React 19 + TypeScript 5.8
- TailwindCSS 4 (via `@tailwindcss/vite` plugin)
- Build output: `dist/` folder

```bash
# Build production
npm run build

# Preview production build
npm run preview
```

---

## 10. Deploy Lên Vercel

### Kết nối repo

1. Truy cập [vercel.com](https://vercel.com) → Import Git Repository
2. Chọn repo chứa code WedPlan AI
3. **Framework Preset**: Vite
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`

### Thêm Environment Variables

Vào **Vercel Dashboard → Project → Settings → Environment Variables**, thêm 5 biến:

| Key                          | Value                     |
|------------------------------|---------------------------|
| `VITE_APPWRITE_ENDPOINT`     | `https://sgp.cloud.appwrite.io/v1` |
| `VITE_APPWRITE_PROJECT_ID`   | `your-project-id`        |
| `VITE_APPWRITE_DATABASE_ID`  | `your-database-id`       |
| `VITE_APPWRITE_BUCKET_ID`    | `your-bucket-id`         |
| `VITE_GEMINI_API_KEY`        | `your-gemini-api-key`    |

### Cấu hình SPA Routing

File `vercel.json` đã sẵn có, xử lý SPA routing (tất cả route → `index.html`):

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Cập nhật Appwrite Platform

Sau khi deploy, quay lại Appwrite Console:
- **Settings → Platforms** → thêm hostname Vercel (VD: `wedplan-ai.vercel.app`)

---

## 11. Luồng Hoạt Động (Usage Flow)

### 11.1. Luồng đăng nhập

```
┌──────────────┐    ┌───────────────┐    ┌──────────────┐    ┌──────────────┐
│  User mở app │───▶│ App.tsx check │───▶│ Có session?  │───▶│ Load profile │
│              │    │ account.get() │    │              │    │ từ Appwrite  │
└──────────────┘    └───────────────┘    └──────┬───────┘    └──────────────┘
                                                │ Không
                                                ▼
                                        ┌──────────────┐
                                        │ Hiện Guest   │
                                        │ mode (hạn chế│
                                        │ tính năng)   │
                                        └──────┬───────┘
                                               │ Nhấn Login
                                               ▼
                                        ┌──────────────┐    ┌──────────────┐
                                        │ Redirect →   │───▶│ Google OAuth  │
                                        │ Google login  │    │ chọn account │
                                        └──────────────┘    └──────┬───────┘
                                                                   │
                                                                   ▼
                                        ┌──────────────┐    ┌──────────────┐
                                        │ initSession()│◀───│ Redirect về  │
                                        │ detect user  │    │ app origin   │
                                        └──────┬───────┘    └──────────────┘
                                               │
                                    ┌──────────┴──────────┐
                                    ▼                     ▼
                            ┌──────────────┐    ┌──────────────┐
                            │ Profile có   │    │ Tạo profile  │
                            │ sẵn → merge  │    │ mới → role   │
                            │ Google info  │    │ USER, chưa   │
                            └──────────────┘    │ active       │
                                                └──────────────┘
```

### 11.2. Hệ thống phân quyền (Role)

| Role    | isActive | Quyền hạn                                                      |
|---------|----------|-----------------------------------------------------------------|
| `GUEST` | —        | Dùng thử hạn chế (giới hạn theo IP), không sync cloud           |
| `USER`  | `false`  | Đã đăng nhập nhưng chưa kích hoạt, quyền tương đương Guest      |
| `USER`  | `true`   | Full access, phải nhập Gemini API Key riêng để dùng AI          |
| `ADMIN` | `true`   | Full access + quản lý user + dùng System Gemini Key             |

### 11.3. Luồng đồng bộ dữ liệu (Cloud Sync)

```
User thay đổi dữ liệu (khách mời, ngân sách, thiệp...)
    → Zustand store update local state
    → Debounce 2-3s
    → saveUserDataToCloud(uid, data)
        → Upsert vào collection user_data (doc ID = uid)
        → Nếu có thiệp mời → upsert vào public_invitations
        → Update lastSeen trong public_profiles
```

### 11.4. Luồng giới hạn Guest (IP-based)

```
Guest dùng tính năng AI/phong thủy
    → Gọi checkGuestIPLimit(feature, maxLimit)
        → Fetch public IP từ ipify.org
        → Đọc document guest_usage (doc ID = IP thay . bằng _)
        → So sánh counter với limit
    → Nếu chưa vượt limit:
        → Cho phép sử dụng
        → incrementGuestIPUsage(feature) — tăng counter +1
    → Nếu vượt limit:
        → Hiện thông báo yêu cầu đăng nhập
```

### 11.5. Luồng Analytics

```
User mở app (bất kỳ role nào)
    → logAppVisit(uid)
        → Kiểm tra sessionStorage (1 lần/ngày)
        → Fetch public IP
        → Ghi document mới vào analytics_logs
            (timestamp, uid, page, ip, referrer, userAgent)

Admin mở tab Quản lý
    → fetchAnalyticsData()
        → Query analytics_logs 7 ngày gần nhất
        → Tổng hợp: lượt truy cập theo ngày, nguồn traffic
        → Query public_profiles: đếm online (lastSeen < 10 phút)
```

### 11.6. Thiệp mời công khai

```
User tạo thiệp mời → Save → Tự động sync vào public_invitations

Chia sẻ link: https://your-app.vercel.app/?view=invitation&uid=USER_ID

Bất kỳ ai mở link:
    → App.tsx detect URL params (view=invitation & uid)
    → Render PublicInvitationView component
    → loadPublicInvitation(uid) — đọc từ public_invitations
    → Hiển thị thiệp (không cần đăng nhập)
```

---

## 12. Troubleshooting

### Login không hoạt động

- ✅ Kiểm tra đã thêm hostname vào Appwrite Platforms
- ✅ Kiểm tra Google OAuth Client ID/Secret đã điền đúng
- ✅ Kiểm tra Authorized Redirect URI trong Google Cloud Console

### Lỗi 401 / Permission denied

- ✅ Kiểm tra Collection permissions (xem mục 6)
- ✅ Bật **Document Security** cho tất cả collections
- ✅ Đảm bảo `analytics_logs` và `guest_usage` có permission `Create: Any` ở collection-level

### Query chậm hoặc lỗi

- ✅ Kiểm tra đã tạo indexes (xem mục 5)
- ✅ Index `idx_lastSeen` trên `public_profiles`
- ✅ Index `idx_timestamp` trên `analytics_logs`

### Ảnh không upload được

- ✅ Kiểm tra Bucket permission: `Create: Any`, `Read: Any`
- ✅ Kiểm tra file size (< 10MB) và đúng extension

### Biến môi trường không nhận

- ✅ Tên biến phải bắt đầu bằng `VITE_` (Vite yêu cầu prefix này)
- ✅ Sau khi sửa `.env.local`, restart dev server (`Ctrl+C` → `npm run dev`)
- ✅ Trên Vercel: redeploy sau khi thêm env vars

---

> 📝 **Tài liệu cập nhật lần cuối**: 20/04/2026
