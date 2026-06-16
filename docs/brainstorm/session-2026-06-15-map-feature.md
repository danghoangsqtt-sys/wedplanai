# Brainstorm Session: Map Feature Fix
Date: 2026-06-15

## Topic: Map Feature not working
- Screenshot provided by user shows: "Đồng hồ đếm ngược" (Countdown), "Địa chỉ tiệc cưới" (Address text input), and "Bản đồ" (Map toggle) side-by-side.
- In `EditorFormPanel.tsx` (the actual panel being used in the UI), we have a toggle for `mapEnabled` and a textarea for `address`, but NO input for `mapLink`. 
- As a result, the `safeMapLink` in `InvitationPreview.tsx` is empty, causing the "MỞ BẢN ĐỒ GOOGLE" button to do nothing when clicked.

## Decisions Made
1. **Input**: Thêm một ô nhập `Link Google Maps (Mã nhúng iFrame)` vào bảng điều khiển bên trái (`EditorFormPanel.tsx`) để người dùng có thể dán mã nhúng từ Google Maps.
2. **Hiển thị**: Bản đồ phải được hiển thị trực tiếp bằng `iframe` trên thiệp cưới, với đầy đủ màu sắc, bo góc đẹp mắt (giống ảnh mẫu), không làm mờ (grayscale) hay ẩn đi dưới dạng nút bấm. Chiều cao bản đồ cần đủ lớn (khoảng 350-400px) để dễ nhìn.

## Action Items
- [ ] Cập nhật `EditorFormPanel.tsx` thêm input cho `mapLink`.
- [ ] Nếu người dùng nhập cả thẻ `<iframe>...</iframe>`, tự động trích xuất thuộc tính `src` để lưu.
- [ ] Cập nhật `InvitationPreview.tsx` phần hiển thị bản đồ: gỡ bỏ class `grayscale`, tăng chiều cao, làm bo góc tròn phù hợp với template.
