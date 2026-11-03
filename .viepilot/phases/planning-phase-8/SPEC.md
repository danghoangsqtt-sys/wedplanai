# Phase 8 — Ngân sách đặt cọc và công nợ

Trạng thái: planned, chưa triển khai. Nhu cầu: biết đã đặt cọc bao nhiêu và còn phải thanh toán bao nhiêu cho từng khoản chi và toàn bộ đám cưới.

## Quy ước số liệu

- Giữ `estimatedCost` là dự toán; `actualCost` là tổng giá chốt/thực tế, không dùng làm tiền đã trả.
- Thêm `agreedCost?: number` nếu cần phân biệt giá chốt bằng 0 với dữ liệu cũ chưa nhập. Tổng nghĩa vụ thanh toán ưu tiên giá chốt đã nhập; nếu chưa chốt dùng dự toán và gắn nhãn tạm tính.
- `payments[]`: id, amount, kind (`deposit` hoặc `payment`), paidAt, note. Tổng cọc là tổng giao dịch deposit; tổng đã trả gồm cọc và các đợt thanh toán. Không cộng cọc hai lần.
- Còn phải trả = max(tổng giá chốt − tổng đã trả, 0). Trả dư hiển thị riêng max(đã trả − giá chốt, 0); không giấu bằng số âm hoặc tự sửa giao dịch.
- `paymentDueDate`, `supplierName`, `supplierPhone` là tùy chọn. Trạng thái thanh toán suy ra từ số tiền; trạng thái công việc Chưa làm/Đang làm/Đã xong giữ độc lập.
- Dữ liệu cũ không có giao dịch hiển thị “Chưa ghi nhận thanh toán”; không tự coi `actualCost` là đã trả, kể cả trạng thái PAID. Cung cấp thao tác xác nhận chuyển đổi có xem trước khi người dùng muốn ghi nhận.
- VND là số nguyên hữu hạn không âm; ngày hợp lệ; tổng đã trả tính từ giao dịch, không lưu đồng thời một trường tổng dễ lệch. Có xác nhận khi xóa giao dịch.

## Các task triển khai

| Task | Phạm vi | File dự kiến |
|---|---|---|
| 8.1 | Model payment, tính cọc/đã trả/còn nợ/trả dư; tương thích dữ liệu cũ và backup | `types.ts`, `lib/budgetPayments.ts`, `store/useStore.ts`, `lib/backup.ts`, tests |
| 8.2 | Form khoản chi và lịch sử thanh toán: thêm cọc, trả nhiều đợt, sửa/xóa, hạn thanh toán/nhà cung cấp | `components/DetailedBudgetPlanner.tsx`, `components/budget/PaymentDialog.tsx`, tests |
| 8.3 | Dashboard tổng dự toán/giá chốt/đã cọc/đã trả/còn trả; lọc sắp đến hạn/quá hạn; CSV, responsive, regression | `components/CommandCenter.tsx`, `App.tsx`, `lib/csv.ts`, tests/e2e, docs |

Thông tin ngân sách nằm trong JSONB `budget_items` đã có RLS và save_plan atomic revision; dự kiến không cần bảng/cột riêng. DTO, backup và AI phải bảo toàn các trường mới. Trước triển khai sẽ viết contract cho từng task và xác nhận các file phụ thuộc thực tế.

## Ví dụ nghiệm thu

Nhà hàng dự toán 120 triệu, chốt 110 triệu, cọc 30 triệu và trả thêm 20 triệu: đã cọc 30, đã trả 50, còn trả 60 triệu. Sửa giá chốt 115 thì còn trả 65. Thanh toán thêm 70 thì còn trả 0, trả dư 5; không tự đổi giá chốt lên 120.

Kiểm thử gồm không cọc, cọc một phần, nhiều đợt, giá chốt 0, khoản tặng miễn phí, trả dư, dữ liệu legacy chưa có payment, restore backup cũ, reload trước/sau cloud ack, lỗi ghi và xung đột hai thiết bị. Không tự suy diễn tiền thực đã chi từ dữ liệu lịch sử thiếu căn cứ.
