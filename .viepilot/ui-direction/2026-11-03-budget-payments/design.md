# UI direction — Ngân sách và công nợ

Đây là bản phác review, không phải tính năng đã gắn vào app.

- Giữ màu hồng của WedPlan; nền xám ấm, panel trắng, số nợ nhấn màu hồng đậm. Quá hạn dùng chữ + nhãn đỏ, không dựa vào màu đơn thuần.
- Font hệ thống Segoe UI / Inter nếu sẵn có, không tải font hoặc script từ bên ngoài. Số tiền tổng hợp dùng triệu/tỷ để dễ đọc; accessible name và tooltip giữ số VND chính xác.
- Desktop: sidebar cố định, tám thẻ thống kê theo hai hàng, lịch chi và ưu tiên thanh toán song song. Mobile: nav trên, hai thẻ mỗi hàng, nội dung một cột.
- Ngân sách có bộ lọc và card mỗi nhà cung cấp. Chi tiết/lần trả dùng native dialog, focus vào số tiền, hỗ trợ Escape và xác nhận nhập.
- Khoảng cách 8/12/16/24/32px, góc panel 18px, nút 10px. Nút chính là hành động ghi nhận thực trả; lịch hẹn là hành động phụ.
- Ngày hẹn chỉ chọn trước/đúng/sau ngày cưới và số ngày. Date picker chỉ dành cho ngày cưới và ngày thực trả.
- Demo tại T+1 của ngày cưới mẫu 20/12/2026; nhãn ngày xem giả lập hiển thị rõ. Không giả là ngày hiện tại của người dùng.
- Không đưa trường kỹ thuật, Auth, RLS, ID hay metadata backend vào luồng nhập ngân sách.
- Dữ liệu mẫu nằm trong bộ nhớ; reload đặt lại ví dụ. Không đọc/ghi localStorage của app hoặc gọi API.
