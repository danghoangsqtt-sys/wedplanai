# 📋 Brainstorm: Điều chỉnh vị trí ảnh bìa thiệp cưới

**Ngày:** 2026-06-15
**Vấn đề:** Khi upload ảnh bìa, CSS `object-fit: cover` crop tự động vào tâm ảnh. Người dùng không thể điều chỉnh phần nào của ảnh hiển thị → ảnh bị cắt mất phần quan trọng (mặt, toàn thân...).

---

## Hiện trạng code

### Đã có sẵn (chưa expose UI):
- **`types.ts`**: `photoConfig?: { scale: number; x: number; y: number }` — type đã định nghĩa
- **`initialData.ts`**: `photoConfig: { scale: 1, x: 0, y: 0 }` — giá trị mặc định
- **`InvitationPreview.tsx`**: Đã render `transform: scale(${scale}) translate(${x}px, ${y}px)` — logic hiển thị có

### Chưa có:
- **InvitationManager.tsx**: **KHÔNG có UI** để điều chỉnh `photoConfig` — chỉ có upload ảnh, không có slider/drag

---

## Giải pháp đề xuất

### Phương án: Drag-to-Pan + Pinch/Scroll-to-Zoom
Thêm một overlay tương tác trực tiếp trên ảnh preview trong phần "Giao diện & Ảnh bìa" của InvitationManager:

1. **Drag (kéo)**: Di chuyển ảnh lên/xuống/trái/phải bằng chuột hoặc touch
2. **Zoom (thu phóng)**: Slider hoặc scroll wheel để phóng to/thu nhỏ
3. **Reset**: Nút reset về vị trí mặc định
4. **Live preview**: Thay đổi phản ánh realtime trên thiệp preview bên phải

### UI Components cần thêm vào InvitationManager:
```
┌─────────────────────────────┐
│  Ảnh Cưới (Cover/Header)    │
│  ┌───────────────────────┐  │
│  │   [Ảnh preview]       │  │
│  │   ← kéo để di chuyển →│  │
│  │   scroll để zoom      │  │
│  └───────────────────────┘  │
│  🔍 [━━━━━●━━━━━] 100%     │  ← Zoom slider
│  ↩ Reset vị trí             │
│  [Upload] [Nhập URL]        │
└─────────────────────────────┘
```

### Áp dụng cho cả Gallery:
- Gallery images cũng sử dụng `object-fit: cover` 
- Có thể thêm tính năng tương tự cho từng ảnh gallery (phase 2)

---

## Phases

### Phase 1: Photo Position Editor cho ảnh bìa
- Thêm drag-to-pan trên ảnh bìa preview trong InvitationManager
- Thêm zoom slider (scale: 1.0 → 2.0)
- Nút reset
- Lưu vào `photoConfig` đã có sẵn
- InvitationPreview.tsx đã render sẵn `transform` → không cần sửa

### Phase 2: Gallery image positioning (tương lai)
- Mở rộng photoConfig cho từng ảnh gallery
- Per-image crop/position

---

## Quyết định kỹ thuật

| Quyết định | Lựa chọn | Lý do |
|---|---|---|
| UI interaction | Drag + Zoom slider | Trực quan, không cần thư viện ngoài |
| Library | Không dùng (vanilla React) | Code đã có sẵn logic, chỉ thiếu UI |
| Lưu trữ | `photoConfig: { scale, x, y }` | Type + render đã sẵn sàng |
| Preview | Real-time trên ảnh nhỏ | Dùng `object-position` thay `transform` |

---

## Ghi chú quan trọng

> ⚠️ Hiện tại InvitationPreview.tsx dùng `transform: translate()` để dịch ảnh. Nhưng do ảnh dùng `object-fit: cover`, `transform` trên thẻ `<img>` sẽ di chuyển **toàn bộ element** chứ không phải nội dung bên trong. 
> 
> **Cách tiếp cận tốt hơn:** Dùng `object-position` CSS property thay vì `transform`. Ví dụ: `object-position: 50% 30%` sẽ hiện phần trên của ảnh thay vì phần giữa.

---

## Tiếp theo
→ `/vp-auto` hoặc `/vp-crystallize` để implement Phase 1
