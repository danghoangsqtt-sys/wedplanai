
import { generateAIContent } from "./aiService";
import { DashboardStats } from "../types";
import { useStore } from "../store/useStore";

// ============================================================
//  WEDPLAN AI — CHUYÊN GIA TƯ VẤN CƯỚI HỎI TOÀN DIỆN
//  Nâng cấp v2: System Prompt chuyên sâu + Chain-of-Thought
// ============================================================

const EXPERT_SYSTEM_PROMPT = `
Bạn là **WedPlan AI** — Chuyên gia tư vấn đám cưới hàng đầu Việt Nam với 20 năm kinh nghiệm.

## NHÂN CÁCH & PHONG CÁCH
- **Giọng điệu:** Thân thiện, dí dỏm nhưng rất chuyên nghiệp. Như người anh/chị lớn đã tổ chức 500+ đám cưới.
- **Ngôn ngữ:** Tiếng Việt tự nhiên, dùng emoji vừa phải (1-2 trên mỗi đoạn), tránh quá formal.
- **Cá tính:** Luôn đưa ra insight bất ngờ mà cặp đôi chưa nghĩ tới. Chủ động cảnh báo sai lầm phổ biến.

## CHUYÊN MÔN SÂU (10 LĨNH VỰC)
1. **Tài chính & Ngân sách** — Phân bổ theo tỷ lệ vàng, đàm phán giá vendor, cash flow management, dự trù phát sinh 15-20%.
2. **Phong tục 3 miền** — Lễ dạm ngõ, ăn hỏi, lễ cưới, rước dâu theo phong tục Bắc/Trung/Nam. Sính lễ, kiêng kỵ, vai trò gia đình.
3. **MC & Kịch bản** — Soạn bài phát biểu, kịch bản MC theo timeline chính xác từng phút, lời dẫn chương trình, lời cảm ơn.
4. **Ẩm thực & Thực đơn** — Menu tiệc theo mùa/vùng miền, số lượng theo bàn (10 người), combo đồ uống, lưu ý dị ứng.
5. **Nhiếp ảnh & Quay phim** — Phong cách chụp (Phóng sự/Fine Art/Vintage), location scouting, timeline chụp, tip tạo dáng.
6. **Thiệp mời & Truyền thông** — Nội dung thiệp (formal/casual/funny), thiệp điện tử, timeline gửi, wording cho từng đối tượng.
7. **Trang phục & Làm đẹp** — Váy cưới (A-line/Ball gown/Mermaid), vest chú rể, makeup, timeline fitting.
8. **Logistics & Vận hành** — Sơ đồ bàn tiệc, phân công nhân sự, parking, plan B thời tiết, timeline ngày cưới.
9. **Tiền mừng & Quà tặng** — Phong bì theo mối quan hệ, cách ghi sổ, quà cảm ơn, return gift ideas.
10. **Tâm lý & Quan hệ** — Xử lý mâu thuẫn gia đình, stress management, cân bằng ý kiến 2 bên, giao tiếp khéo léo.

## QUY TẮC TRẢ LỜI (BẮT BUỘC)

### Cấu trúc câu trả lời:
1. **Hook** (1 câu) — Bắt đầu bằng nhận xét/insight liên quan đến câu hỏi
2. **Nội dung chính** — Trả lời chi tiết, có cấu trúc rõ ràng (gạch đầu dòng, đánh số)
3. **Pro Tips** — 1-2 mẹo thực tế mà ít ai biết (bắt đầu bằng 💡)
4. **Cảnh báo** (nếu có) — Sai lầm phổ biến cần tránh (bắt đầu bằng ⚠️)
5. **Follow-up** — Gợi ý câu hỏi tiếp theo để đào sâu hơn

### Khi phân tích tài chính:
- Luôn THAM CHIẾU số liệu thật từ "Dữ liệu đám cưới" được cung cấp
- So sánh với benchmark thị trường Việt Nam 2024-2025
- Nếu chi phí thực > 110% dự kiến → Cảnh báo vượt ngân sách
- Tính toán ROI tiền mừng vs chi phí thực
- Đưa ra 2-3 phương án A/B/C với mức giá khác nhau

### Khi soạn nội dung (kịch bản, bài phát biểu, thiệp):
- Soạn NGUYÊN VĂN, sẵn sàng dùng ngay, KHÔNG viết dạng outline
- Cung cấp 2 phiên bản: Trang trọng + Hiện đại
- Đánh dấu chỗ cần thay đổi bằng [TÊN CHÚ RỂ], [TÊN CÔ DÂU], etc.
- Thêm stage direction / hướng dẫn diễn xuất nếu là kịch bản MC

### Khi tư vấn vendor/dịch vụ:
- Đưa ra range giá thị trường cụ thể (VNĐ)
- Phân loại: Budget / Mid-range / Premium
- Checklist câu hỏi cần hỏi vendor trước khi ký hợp đồng
- Red flags cần tránh

### Định dạng:
- Dùng **bold** cho keywords quan trọng
- Dùng gạch đầu dòng (- hoặc •) cho danh sách
- Dùng 📌 cho action items
- Dùng 💡 cho pro tips
- Dùng ⚠️ cho cảnh báo
- Dùng bảng khi so sánh nhiều lựa chọn
- KHÔNG dùng heading (#) — chỉ dùng bold
- Giữ mỗi đoạn ngắn gọn (2-4 câu), tách đoạn bằng dòng trống
`;

export const getFinancialAdvice = async (
  stats: DashboardStats,
  history: { role: string; content: string }[],
  userMessage: string
) => {
  const user = useStore.getState().user;
  const { guests, budgetItems } = useStore.getState();

  // --- Build rich context from real data ---
  const guestByGroup = {
    nhaTrai: guests.filter(g => g.group === 'NHA_TRAI').length,
    nhaGai: guests.filter(g => g.group === 'NHA_GAI').length,
    banBe: guests.filter(g => g.group === 'BAN_BE').length,
    dongNghiep: guests.filter(g => g.group === 'DONG_NGHIEP').length,
    confirmed: guests.filter(g => g.probability === 100).length,
    totalChildren: guests.reduce((acc, g) => acc + g.childrenCount, 0),
  };

  const budgetByCategory = budgetItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.estimatedCost;
    return acc;
  }, {} as Record<string, number>);

  const topExpenses = [...budgetItems]
    .sort((a, b) => b.estimatedCost - a.estimatedCost)
    .slice(0, 5)
    .map(i => `${i.name}: ${i.estimatedCost.toLocaleString('vi-VN')} VNĐ (${i.status})`)
    .join('\n    ');

  const overBudgetItems = budgetItems.filter(i => i.actualCost > i.estimatedCost && i.actualCost > 0);
  const overBudgetWarning = overBudgetItems.length > 0
    ? `\n    ⚠️ VƯỢT NGÂN SÁCH: ${overBudgetItems.map(i => `${i.name} (dự kiến ${i.estimatedCost.toLocaleString('vi-VN')} → thực tế ${i.actualCost.toLocaleString('vi-VN')})`).join(', ')}`
    : '';

  const contextData = `
    === DỮ LIỆU ĐÁM CƯỚI HIỆN TẠI (Real-time) ===

    📊 TỔNG QUAN:
    - Tổng ngân sách dự kiến: ${stats.totalBudget.toLocaleString('vi-VN')} VNĐ
    - Đã chi thực tế: ${stats.totalActual.toLocaleString('vi-VN')} VNĐ
    - Còn lại: ${(stats.totalBudget - stats.totalActual).toLocaleString('vi-VN')} VNĐ
    - % đã chi: ${stats.totalBudget > 0 ? Math.round((stats.totalActual / stats.totalBudget) * 100) : 0}%
    - Nhiệm vụ chưa hoàn thành: ${stats.pendingTasks}

    👥 KHÁCH MỜI:
    - Tổng khách: ${stats.totalGuests} người (+ ${guestByGroup.totalChildren} trẻ em)
    - Khách xác nhận (100%): ${guestByGroup.confirmed}
    - Nhà Trai: ${guestByGroup.nhaTrai} | Nhà Gái: ${guestByGroup.nhaGai} | Bạn bè: ${guestByGroup.banBe} | Đồng nghiệp: ${guestByGroup.dongNghiep}
    - Số khách ước lượng (có trọng số xác suất): ${Math.round(stats.weightedGuestCount)}
    - Tiền mừng dự kiến: ${stats.expectedGiftMoney.toLocaleString('vi-VN')} VNĐ

    💰 TOP 5 CHI PHÍ LỚN NHẤT:
    ${topExpenses}
    ${overBudgetWarning}

    📋 NGÂN SÁCH THEO HẠNG MỤC:
    ${Object.entries(budgetByCategory).map(([cat, amount]) =>
      `- ${cat}: ${(amount as number).toLocaleString('vi-VN')} VNĐ`
    ).join('\n    ')}
  `;

  // --- Build conversation history (keep last 10 messages for context) ---
  const recentHistory = history.slice(-10).map(h => `${h.role === 'user' ? 'Người dùng' : 'AI'}: ${h.content}`).join('\n');

  const fullSystemPrompt = EXPERT_SYSTEM_PROMPT + `\n\n` + contextData + `\n\n    📜 LỊCH SỬ TRÒ CHUYỆN GẦN ĐÂY:\n${recentHistory}`;

  return await generateAIContent(user, fullSystemPrompt, userMessage);
};

export const getCulturalAdvice = async (
  region: string,
  stageTitle: string,
  queryType: 'SPEECH' | 'OFFERING' | 'TIPS'
): Promise<string> => {
  const user = useStore.getState().user;

  const CULTURAL_EXPERT_PROMPT = `
Bạn là Giáo sư Văn hóa Dân gian Việt Nam — chuyên gia hàng đầu về phong tục cưới hỏi 3 miền Bắc/Trung/Nam.
Phong cách: Uyên bác nhưng dễ hiểu, trích dẫn nguồn gốc phong tục, so sánh xưa-nay.
Luôn cung cấp thông tin THỰC TẾ, CÓ THỂ ÁP DỤNG NGAY cho gia đình hiện đại.
Định dạng: Dùng gạch đầu dòng, bold cho key points, emoji vừa phải.
  `;

  let prompt = "";
  if (queryType === 'SPEECH') {
    prompt = `Hãy soạn một bài phát biểu NGUYÊN VĂN (sẵn sàng đọc trước quan khách) dành cho đại diện gia đình (Bố hoặc Bác) trong nghi lễ "${stageTitle}" theo phong tục cưới hỏi Miền ${region} Việt Nam.

YÊU CẦU:
- Soạn 2 phiên bản: **Trang trọng** (cho gia đình truyền thống) và **Hiện đại** (cho gia đình trẻ)
- Độ dài mỗi bản: 2-3 phút đọc (khoảng 300-400 từ)
- Đánh dấu chỗ cần thay: [TÊN CON TRAI/GÁI], [TÊN SUI GIA], etc.
- Thêm ghi chú: Lúc nào nên dừng, nơi nào nên nhấn giọng, khi nào cúi chào`;
  } else if (queryType === 'OFFERING') {
    prompt = `Hãy liệt kê CHI TIẾT và giải thích ý nghĩa các sính lễ (lễ vật) cần thiết cho nghi lễ "${stageTitle}" theo phong tục cưới Miền ${region}.

YÊU CẦU:
- Liệt kê từng món lễ vật kèm: SỐ LƯỢNG cụ thể, Ý NGHĨA tâm linh, GIÁ tham khảo (VNĐ)
- Phân biệt: Bắt buộc vs Tùy chọn
- Lưu ý: Kiêng kỵ số lượng, màu sắc, cách bày trí
- So sánh: Phong tục truyền thống vs Xu hướng hiện đại
- Mẹo tiết kiệm nhưng vẫn đủ lễ`;
  } else {
    prompt = `Cho tôi lời khuyên THỰC TẾ và các điều kiêng kỵ cần lưu ý khi tổ chức "${stageTitle}" theo phong tục Miền ${region}.

YÊU CẦU:
- Chia thành: ✅ NÊN LÀM và ❌ KHÔNG NÊN LÀM
- Giải thích NGUỒN GỐC mỗi điều kiêng kỵ (tại sao phải kiêng)
- Phân biệt: Kiêng kỵ quan trọng vs Mê tín có thể bỏ qua
- Tình huống thực tế: "Nếu lỡ vi phạm thì sao?"
- Pro tips từ kinh nghiệm thực tế`;
  }

  return await generateAIContent(user, CULTURAL_EXPERT_PROMPT, prompt);
};
