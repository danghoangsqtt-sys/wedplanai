---
session_id: 2026-11-03-budget-payments
project: wedplanai
created: 2026-11-03
updated: 2026-11-03
status: review_draft
---

## decisions

```yaml
- id: D1
  topic: Payment due dates
  chosen: only_relative_to_wedding_date
  status: decided_by_user
- id: D2
  topic: Price, schedule, payments and allocations
  chosen: separate_canonical_records_shared_derived_totals
  status: proposed
- id: D3
  topic: Personal access
  chosen: preserve_existing_pin_and_storage
  status: decided_in_prior_session
- id: D4
  topic: Legacy actualCost
  chosen: preserve_and_request_explicit_reconciliation
  status: proposed
- id: D5
  topic: Overpayment
  chosen: record_with_confirmation_and_report_per_supplier
  status: proposed
```

## erd

```yaml
physical_storage: existing_budget_items_jsonb
new_sql_tables: none_assumed
entities:
  - {name: Plan, attributes: [uid, weddingDate, budgetItems], primary_key: uid}
  - {name: BudgetItem, attributes: [id, estimatedCost, agreedCost_optional, supplierName, workStatus, paymentSchedule, payments], primary_key: id}
  - {name: PaymentSchedule, attributes: [id, label, offsetDays, amount, settledDueDate_optional], primary_key: id}
  - {name: Payment, attributes: [id, kind, amount, paidAt, note, allocations], primary_key: id}
  - {name: PaymentAllocation, attributes: [scheduleId_nullable, amount]}
relationships:
  - Plan_has_many_BudgetItems
  - BudgetItem_has_many_PaymentSchedules
  - BudgetItem_has_many_Payments
  - Payment_has_many_Allocations
  - Allocation_targets_zero_or_one_Schedule
```

## Coverage

Coverage matrix đồng bộ tại `../../ui-direction/2026-11-03-budget-payments/notes.md` và trang `feature-map.html`. Mỗi khả năng Phase 1 có ít nhất một phần dữ liệu hoặc UI; đối chiếu legacy được bao phủ bởi đặc tả, chưa có form tương tác.

## Pages inventory

- `index.html`: hub review.
- `erd.html`: quan hệ dữ liệu, SVG offline và Mermaid nguồn.
- `data-flow.html`: luồng ghi nhận, phép tính, ví dụ và bất biến.
- `decisions.html`: quyết định đã chốt/đề xuất và giới hạn bản phác.
- `feature-map.html`: đối chiếu dữ liệu với UI.
- `architecture.html`: lưu trữ, giữ PIN, backup và chuyển đổi dữ liệu cũ.
- `erd.mmd`, `data-flow.mmd`: nguồn sơ đồ có thể tái sử dụng; không có thư viện Mermaid phụ thuộc mạng khi xem HTML.

## tech_stack

```yaml
existing_app: React_TypeScript_Zustand
existing_optional_cloud: Supabase_JSONB_RLS_revision
prototype: standalone_HTML_CSS_JavaScript
architecture_visuals: native_inline_SVG_plus_Mermaid_sources
external_dependencies_for_viewing: none
```

## open_questions

- Duyệt thao tác phân bổ một khoản trả cho nhiều đợt và cảnh báo trả dư.
- Duyệt nội dung tám thẻ dashboard và thứ tự ưu tiên thanh toán.
- Cần phác tiếp màn hình đối chiếu số cũ trước khi crystallize hay dùng đặc tả đã ghi?

## architect_to_ui_sync

Các ràng buộc mô hình đã được thể hiện trong UI được người dùng yêu cầu: loại cọc, lịch T±N, ngày thực trả riêng, preview phân bổ, không bù nợ chéo nhà cung cấp, cảnh báo chưa xếp lịch và nút công việc độc lập tiền. Đây là đồng bộ trong phạm vi hai artifact đã được chọn, không sửa app thật.
