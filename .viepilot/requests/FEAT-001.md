# FEAT: Bản đồ Google Map và địa chỉ

## Meta
- **ID**: FEAT-001
- **Type**: Feature
- **Status**: new
- **Priority**: high
- **Created**: 2026-06-15
- **Reporter**: User
- **Assignee**: AI

## Summary
Tính năng bản đồ cho phép người dùng cập nhật cả địa chỉ và link google map, trên thiệp có hiển thị bản đồ trên google map vị trí tiệc cưới được hiện icon màu đỏ đẹp.

## Details
- Cập nhật EditorFormPanel để nhập link Google Map.
- Giao diện gồm 1 input cho "Địa chỉ tiệc cưới" (dạng text hoặc textarea) và 1 input cho "Link Google Map".
- Trên giao diện preview (InvitationPreview), sử dụng link Google Map (có thể iframe nhúng) hoặc hiển thị bản đồ với icon màu đỏ đẹp mắt tại vị trí tiệc cưới.

## Acceptance Criteria
- [ ] Cho phép nhập và lưu `mapUrl`.
- [ ] Hiển thị bản đồ Google Maps trên thiệp.
- [ ] Có icon đánh dấu vị trí màu đỏ đẹp.
