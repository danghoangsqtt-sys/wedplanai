interface MilestoneData {
  id: string;
  label: string;
  shortLabel: string;
  desc: string;
  daysOffset: number;
  color: string; // Tailwind bg class for active state
  ringColor: string; // Tailwind ring class
  defaultTasks: Array<{ title: string; notes: string }>;
}

export const MILESTONES: MilestoneData[] = [
  {
    id: "m12",
    label: "T-12 tháng",
    shortLabel: "T-12",
    daysOffset: -365,
    desc: "Chọn ngày & đặt địa điểm",
    color: "bg-blue-500",
    ringColor: "ring-blue-400",
    defaultTasks: [
      {
        title: "Chọn & chốt ngày cưới",
        notes:
          "Kiểm tra lịch âm dương, tránh ngày xấu, thống nhất cả 2 bên gia đình",
      },
      {
        title: "Khảo sát & đặt địa điểm tổ chức",
        notes: "So sánh ít nhất 3 nhà hàng về giá, sức chứa, phong cách, menu",
      },
      {
        title: "Lập danh sách khách mời sơ bộ",
        notes: "Tổng hợp từ 2 bên gia đình để ước tính tổng số khách",
      },
      {
        title: "Xác định & phân bổ ngân sách tổng",
        notes:
          "Phân % theo hạng mục: địa điểm ~40%, ảnh/quay ~10%, trang phục ~10%...",
      },
      {
        title: "Chọn style & concept đám cưới",
        notes:
          "Tông màu chủ đạo, phong cách (hiện đại, cổ điển, boho, garden...)",
      },
    ],
  },
  {
    id: "m9",
    label: "T-9 tháng",
    shortLabel: "T-9",
    daysOffset: -270,
    desc: "Đặt ảnh cưới & dịch vụ chính",
    color: "bg-indigo-500",
    ringColor: "ring-indigo-400",
    defaultTasks: [
      {
        title: "Đặt gói chụp ảnh pre-wedding",
        notes: "Xem portfolio, thống nhất concept, địa điểm, ngày chụp",
      },
      {
        title: "Đặt quay phim ngày cưới",
        notes: "Xem demo video, chọn phong cách: cinematic hay phóng sự",
      },
      {
        title: "Chọn & đặt cọc MC",
        notes: "Nghe thử giọng, kiểm tra kinh nghiệm và phong cách dẫn",
      },
      {
        title: "Đặt ban nhạc / DJ",
        notes:
          "Thống nhất danh sách bài, thời lượng biểu diễn, thiết bị âm thanh",
      },
      {
        title: "Đặt cọc makeup artist & làm tóc",
        notes: "Xem portfolio, thống nhất số lần thay trang phục trong ngày",
      },
    ],
  },
  {
    id: "m6",
    label: "T-6 tháng",
    shortLabel: "T-6",
    daysOffset: -180,
    desc: "Chọn váy & thiết kế thiệp",
    color: "bg-violet-500",
    ringColor: "ring-violet-400",
    defaultTasks: [
      {
        title: "Thử & chọn váy cưới cô dâu",
        notes: "Thử ít nhất 5-7 mẫu ở nhiều tiệm, chụp ảnh để so sánh sau",
      },
      {
        title: "Chọn & đặt trang phục chú rể",
        notes: "Đo may hoặc thuê vest, phối màu theo váy cô dâu",
      },
      {
        title: "Thiết kế & in thiệp mời",
        notes: "Kiểm tra kỹ nội dung trước khi in, in dư 10% số lượng cần",
      },
      {
        title: "Đặt hoa cưới & trang trí sân khấu",
        notes: "Xác nhận màu hoa, kiểu cắm, backdrop, phù hợp concept",
      },
      {
        title: "Đặt bánh cưới",
        notes: "Thử vị bánh, chọn mẫu & số tầng, thống nhất ngày giao",
      },
      {
        title: "Chọn nhẫn cưới",
        notes: "So sánh chất liệu vàng/bạch kim, khắc tên & ngày cưới vào nhẫn",
      },
    ],
  },
  {
    id: "m3",
    label: "T-3 tháng",
    shortLabel: "T-3",
    daysOffset: -90,
    desc: "Gửi thiệp & xác nhận khách",
    color: "bg-purple-500",
    ringColor: "ring-purple-400",
    defaultTasks: [
      {
        title: "Gửi thiệp mời đến toàn bộ khách",
        notes: "Gửi trước ít nhất 6 tuần, nhắn tin/gọi xác nhận thêm",
      },
      {
        title: "Tổng hợp & xác nhận số khách tham dự",
        notes: "Cập nhật vào danh sách, thông báo số lượng cho nhà hàng",
      },
      {
        title: "Thử & duyệt menu tiệc cưới",
        notes: "Chọn 5-7 món, lưu ý thực khách ăn chay hoặc dị ứng",
      },
      {
        title: "Đặt xe hoa & đoàn đón dâu",
        notes: "Thống nhất số lượng xe, trang trí, lịch trình di chuyển",
      },
      {
        title: "Đặt phòng cưới / khách sạn đêm tân hôn",
        notes: "Đặt sớm để có phòng phù hợp, kiểm tra chính sách hủy",
      },
    ],
  },
  {
    id: "m1",
    label: "T-1 tháng",
    shortLabel: "T-1",
    daysOffset: -30,
    desc: "Thử váy & tổng duyệt",
    color: "bg-amber-500",
    ringColor: "ring-amber-400",
    defaultTasks: [
      {
        title: "Thử váy cưới lần cuối",
        notes:
          "Kiểm tra chỉnh sửa hoàn tất, test phụ kiện giày, vương miện đầy đủ",
      },
      {
        title: "Tổng duyệt nghi lễ & chương trình tiệc",
        notes: "Chạy toàn bộ flow với MC, nhà hàng, nhạc, quay phim",
      },
      {
        title: "Xác nhận lại toàn bộ nhà cung cấp",
        notes: "Gọi điện cho từng đơn vị, kiểm tra hợp đồng, giờ có mặt",
      },
      {
        title: "Chuẩn bị phong bì & quà cảm ơn",
        notes: "Phong bì cho phù dâu, phù rể, ekip hỗ trợ trong ngày",
      },
      {
        title: "Làm trang điểm thử chính thức",
        notes: "Test full look: tóc + makeup + phụ kiện, chụp ảnh kiểm tra",
      },
    ],
  },
  {
    id: "mw",
    label: "Tuần cưới",
    shortLabel: "Tuần C",
    daysOffset: -7,
    desc: "Hoàn thiện & dưỡng sức",
    color: "bg-orange-500",
    ringColor: "ring-orange-400",
    defaultTasks: [
      {
        title: "Họp mặt & briefing toàn đội ngũ",
        notes: "Thống nhất phân công, thời gian có mặt, số điện thoại liên hệ",
      },
      {
        title: "Chuẩn bị hành lý tuần trăng mật",
        notes: "Check vé, hộ chiếu/CCCD, đặt khách sạn, đóng gói hành lý",
      },
      {
        title: "Chuẩn bị đồ cho ngày cưới",
        notes: "Váy, giày, phụ kiện, đồ trang điểm, đóng gói sẵn từ hôm trước",
      },
      {
        title: "Nghỉ ngơi & dưỡng da dưỡng sức",
        notes: "Ngủ đủ giấc, uống đủ nước, tránh lịch họp căng thẳng",
      },
    ],
  },
  {
    id: "d0",
    label: "Ngày cưới",
    shortLabel: "Ngày C",
    daysOffset: 0,
    desc: "Hạnh phúc mãi mãi 💍",
    color: "bg-rose-500",
    ringColor: "ring-rose-400",
    defaultTasks: [
      {
        title: "Cô dâu trang điểm & làm đầu",
        notes: "Đặt lịch sớm, dự phòng thêm 1-2 tiếng so với kế hoạch",
      },
      {
        title: "Chụp ảnh gia đình trước lễ",
        notes: "Chuẩn bị danh sách ảnh cần chụp với từng nhóm người thân",
      },
      {
        title: "Giao toàn bộ điều phối cho người phụ trách",
        notes: "Trưởng nhóm phụ trách xử lý mọi phát sinh trong ngày",
      },
      {
        title: "Tận hưởng ngày trọng đại!",
        notes: "Hít thở, mỉm cười và sống trọn vẹn khoảnh khắc này 🥰",
      },
    ],
  },
];
