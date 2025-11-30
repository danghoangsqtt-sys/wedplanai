
import { generateAIContent } from "./aiService";
import { DashboardStats } from "../types";
import { useStore } from "../store/useStore";

export const getFinancialAdvice = async (
  stats: DashboardStats,
  history: { role: string; content: string }[],
  userMessage: string
) => {
  const user = useStore.getState().user;

  const systemInstruction = `
    Bạn là một chuyên gia tư vấn tài chính và kế hoạch đám cưới chuyên nghiệp cho người Việt Nam (WedPlan AI).
    Ngôn ngữ trả lời: Tiếng Việt.
    Giọng điệu: Thân thiện, thực tế, thấu hiểu áp lực tài chính và phong tục tập quán.

    Dữ liệu đám cưới hiện tại:
    - Tổng ngân sách dự kiến: ${stats.totalBudget.toLocaleString('vi-VN')} VNĐ
    - Thực tế đã chi: ${stats.totalActual.toLocaleString('vi-VN')} VNĐ
    - Nhiệm vụ chưa hoàn thành: ${stats.pendingTasks}
    - Tiền mừng dự kiến thu về: ${stats.expectedGiftMoney.toLocaleString('vi-VN')} VNĐ

    Lịch sử trò chuyện:
    ${history.map(h => `${h.role}: ${h.content}`).join('\n')}

    Nhiệm vụ của bạn:
    1. Trả lời câu hỏi người dùng về tài chính hoặc phân công nhiệm vụ.
    2. Nếu người dùng hỏi "Ai trả tiền cho cái này?", hãy dùng kiến thức phong tục để tư vấn.
    3. Cảnh báo rủi ro nếu chi phí thực vượt quá ngân sách.
  `;

  return await generateAIContent(user, systemInstruction, userMessage);
};

export const getCulturalAdvice = async (
  region: string,
  stageTitle: string,
  queryType: 'SPEECH' | 'OFFERING' | 'TIPS'
): Promise<string> => {
  const user = useStore.getState().user;
  
  let prompt = "";
  if (queryType === 'SPEECH') {
    prompt = `Hãy soạn một bài phát biểu ngắn gọn, trang trọng và tình cảm dành cho đại diện gia đình (Bố hoặc Bác) trong nghi lễ "${stageTitle}" theo phong tục cưới hỏi Miền ${region} Việt Nam. Chỉ in ra nội dung bài phát biểu.`;
  } else if (queryType === 'OFFERING') {
    prompt = `Hãy liệt kê chi tiết và giải thích ý nghĩa các sính lễ (lễ vật) cần thiết cho nghi lễ "${stageTitle}" theo phong tục cưới Miền ${region}.`;
  } else {
    prompt = `Cho tôi lời khuyên và các điều kiêng kỵ cần lưu ý khi tổ chức "${stageTitle}" theo phong tục Miền ${region}.`;
  }

  return await generateAIContent(user, "Bạn là chuyên gia văn hóa đám cưới Việt Nam.", prompt);
};
