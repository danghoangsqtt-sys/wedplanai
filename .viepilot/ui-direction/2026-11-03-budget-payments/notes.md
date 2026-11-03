---
session_id: 2026-11-03-budget-payments
project: wedplanai
created: 2026-11-03
updated: 2026-11-03
status: review_draft
language: vi
workspace_mode: both
---

## Quyết định và phạm vi

- Người dùng chọn **cả giao diện và sơ đồ dữ liệu**; lịch hẹn chỉ T−N / T / T+N.
- Bản phác gồm hai màn hình trong `index.html`: dashboard và danh sách ngân sách; ba form thêm khoản, thêm đợt, ghi nhận thực trả, kèm chi tiết/lịch sử.
- Prototype sử dụng toàn bộ dữ liệu mẫu trong bộ nhớ. Không thay đổi app đang dùng PIN, không lấy dữ liệu đám cưới thật.
- Mẫu cố định ba nhà cung cấp: giá chốt 140 triệu, đã cọc 37 triệu, đã trả 57 triệu, còn nợ 83 triệu; nợ sau cưới 73 triệu, nợ trước/ngày cưới 10 triệu.
- Tổng công nợ cộng theo từng nhà cung cấp, không lấy trả dư bên này bù bên khác.
- Một lần trả có thể được phân vào nhiều đợt. Có xem trước phân bổ; ưu tiên đợt được chọn rồi ngày gần hạn, phần chưa xếp lịch, cuối cùng là trả dư có xác nhận.
- Tạo lịch không tạo tiền đã trả. Đổi trạng thái dịch vụ không thay đổi tiền. Khi xếp lịch cho tiền đã trả ở phần chưa phân đợt, chuyển phân loại tương ứng, không nhân đôi giao dịch.
- Mẫu yêu cầu nhập giá đã chốt cho khoản mới. `agreedCost` chưa có ở dữ liệu cũ vẫn là trường hợp cần màn hình đối chiếu trong app thật, không bị ngầm coi bằng 0.

## Coverage

| Khả năng Phase 1 | Architect coverage | UI screen / state |
|---|---|---|
| Giá chốt, cọc, tổng đã trả, còn nợ | erd, data-flow | Dashboard, card nhà cung cấp, dialog chi tiết |
| Lịch chỉ theo mốc cưới | erd, decisions D1 | Thêm đợt, mốc và ngày được tính |
| Trả một phần/nhiều lần và phân bổ | data-flow F1, erd | Form ghi nhận, preview phân bổ, lịch sử |
| Cần trả sau cưới | data-flow F2 | Thẻ sau cưới, lọc sau cưới, timeline |
| Quá hạn / sắp đến hạn | data-flow F2 | Thẻ và danh sách ưu tiên, ngày xem giả lập |
| Dịch vụ đã xong nhưng còn nợ | erd E2 | Dropdown trạng thái dịch vụ độc lập |
| Chưa xếp lịch, trả dư, giá chốt 0 | decisions, data-flow | Nhắc thiếu lịch, xác nhận trả dư, khoản 0 hiển thị riêng |
| Đổi ngày cưới và giữ lịch sử thực trả | decisions, architecture | Chọn ngày cưới, kiểm tra mốc và lịch sử |
| Dữ liệu cũ / backup | architecture, decisions legacy | Đặc tả; chưa phác form đối chiếu legacy |
| Mobile, số lớn, tên dài | feature-map | Responsive dashboard, card, dialog |

## Pages inventory

| File | Vai trò | Link |
|---|---|---|
| index.html | Hai view dashboard/ngân sách, form và dialog chi tiết | Màn hình chính |
| ../../architect/2026-11-03-budget-payments/index.html | Hub dữ liệu và các trang sơ đồ/quy tắc | Link trong sidebar |

Không tạo `pages/`; hai view trong cùng tài liệu để chia sẻ dữ liệu mẫu tức thì.

## design_tokens

```yaml
primary: '#e74470'
primary_dark: '#be2b52'
surface: '#ffffff'
background: '#f8f8fb'
text: '#282a36'
muted: '#7f8092'
danger: '#c44746'
success: '#167759'
font_family: 'Inter, Segoe UI, Arial, sans-serif'
panel_radius_px: 18
spacing_px: [8, 12, 16, 24, 32]
```

## skills_used

```yaml
skills: [vp-brainstorm]
external_ui_skill: none
registry: unavailable
principles: [responsive_layout, native_dialog_focus, labels_and_keyboard, escaped_user_input, reduced_motion, explicit_sample_data]
```

## admin

```yaml
scope: personal_couple_tool
new_roles: none
transaction_history: propose_confirmation_and_traceable_correction
automatic_payment: false
```

## content

```yaml
cms: not_applicable
media_uploads: not_added
```

## user_data

```yaml
prototype_storage: memory_only
reads_real_plan: false
network_calls: none
pin_change: none
```

## UX verification log

Đã kiểm tra 12 tình huống bằng Chrome desktop/mobile. Không lỗi JavaScript, không request HTTP/API ngoài; ảnh dashboard, ngân sách, form thanh toán và sơ đồ đã xem lại. Kết quả cụ thể trong `verification.json`; chạy lại bằng `node .viepilot/ui-direction/2026-11-03-budget-payments/verify.cjs`. Đây là QA nội bộ, chưa phải quy trình UX walkthrough ba giai đoạn có web research.

Các stress pass đã làm: tên khoản dài, giá trị hàng tỷ VND, màn hình 390px, số âm bị từ chối, giá chốt bằng 0, trả dư, dời ngày cưới, khoản đã trả nhưng chưa xếp lịch. Không có tràn ngang toàn trang; sơ đồ rộng được cuộn trong panel riêng.

Thao tác tự mở hai tab từ shell bị automatic approval review từ chối với lý do “blocked by policy”. Không thử mở qua công cụ khác; cung cấp link để người dùng chủ động mở. Không tuyên bố đã mở tab thành công.

## Giới hạn để duyệt

Chưa phác đầy đủ chuyển đổi actualCost cũ, sửa/void giao dịch bất kỳ trong lịch sử, hoàn cọc/hoàn tiền, bằng chứng chuyển khoản, xuất file hay lưu cloud. Có thể hoàn tác thao tác mới nhất và đặt lại ví dụ để thử luồng. Không đánh dấu những phần này là đã triển khai.
