
import { generateAIContent } from './aiService';
import { UserProfile, LocalMarketReport, LocalMarketSection } from '../types';

export const VIETNAM_PROVINCES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
  'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
  'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
  'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
  'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
  'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
  'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định',
  'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên',
  'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
  'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
  'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang',
  'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái',
];

export interface MarketCategory {
  id: string;
  emoji: string;
  label: string;
  budgetCategories: string[];
}

export const MARKET_CATEGORIES: MarketCategory[] = [
  { id: 'gold', emoji: '🥇', label: 'Giá vàng & trang sức cưới', budgetCategories: ['Trang Sức'] },
  { id: 'photo', emoji: '📸', label: 'Studio chụp ảnh & quay phim cưới', budgetCategories: ['Ảnh & Phim'] },
  { id: 'venue', emoji: '🏛️', label: 'Thuê sảnh tiệc cưới', budgetCategories: ['Tiệc Cưới'] },
  { id: 'attire', emoji: '👗', label: 'May & thuê áo cưới, vest chú rể', budgetCategories: ['Trang Phục & Làm Đẹp'] },
  { id: 'decor', emoji: '🌸', label: 'Trang trí & hoa cưới', budgetCategories: ['Trang Trí'] },
  { id: 'makeup', emoji: '💄', label: 'Trang điểm cô dâu (makeup artist)', budgetCategories: ['Trang Phục & Làm Đẹp'] },
  { id: 'car', emoji: '🚗', label: 'Xe hoa rước dâu', budgetCategories: ['Xe Cộ'] },
  { id: 'mc', emoji: '🎤', label: 'MC & ban nhạc sống / DJ', budgetCategories: ['MC & Âm Nhạc'] },
  { id: 'cake', emoji: '🎂', label: 'Bánh cưới & thiệp mời in ấn', budgetCategories: ['Bánh Cưới', 'Thiệp Mời'] },
  { id: 'engagement', emoji: '💍', label: 'Sính lễ & mâm quả lễ hỏi', budgetCategories: ['Lễ Ăn Hỏi'] },
];

export async function detectProvince(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=vi`,
            { headers: { 'Accept-Language': 'vi' } }
          );
          const data = await res.json();
          const raw = data.address?.state || data.address?.city || data.address?.county || '';
          // Normalize: strip "Tỉnh ", "Thành phố " prefix
          const normalized = raw.replace(/^(Tỉnh|Thành phố)\s+/i, '').trim();
          // Match against our known list (fuzzy: includes check)
          const match = VIETNAM_PROVINCES.find(p =>
            p === normalized ||
            p.includes(normalized) ||
            normalized.includes(p.replace('TP. ', ''))
          );
          resolve(match || normalized || null);
        } catch {
          resolve(null);
        }
      },
      () => resolve(null),
      { timeout: 8000 }
    );
  });
}

const SYSTEM_PROMPT = `Bạn là chuyên gia tư vấn dịch vụ đám cưới tại Việt Nam với 20 năm kinh nghiệm thực tế.
Bạn nắm rõ mức giá, thị trường, phong tục và đặc điểm của từng tỉnh thành trên khắp 3 miền Bắc - Trung - Nam.
Chỉ trả về JSON hợp lệ, không có markdown, không có text ngoài JSON.`;

export async function generateLocalMarketReport(
  province: string,
  selectedCategoryIds: string[],
  user: UserProfile
): Promise<LocalMarketReport> {
  const categories = MARKET_CATEGORIES.filter(c => selectedCategoryIds.includes(c.id));
  if (!categories.length) throw new Error('Chưa chọn danh mục nào.');

  const prompt = `Cung cấp thông tin thị trường dịch vụ cưới tại "${province}" cho các danh mục sau:
${categories.map(c => `- ${c.id}: ${c.label}`).join('\n')}

Trả về JSON với cấu trúc CHÍNH XÁC sau (không thêm trường nào khác):
{
  "province": "${province}",
  "region": "NORTH" | "CENTRAL" | "SOUTH",
  "economicLevel": "HIGH" | "MID" | "LOW",
  "generatedAt": "${new Date().toISOString()}",
  "sections": [
    {
      "id": "string (khớp id danh mục)",
      "label": "string",
      "emoji": "string",
      "summary": "string (2-3 câu mô tả đặc điểm thị trường tại ${province}, đề cập giá cả, số lượng nhà cung cấp, lưu ý đặc thù địa phương)",
      "avgLow": number (VNĐ, mức giá thấp điển hình),
      "avgHigh": number (VNĐ, mức giá cao điển hình),
      "priceNote": "string (ghi chú đơn vị tính, ví dụ: 'triệu/cặp', 'triệu/bộ ảnh')",
      "items": [
        {
          "name": "string (tên dịch vụ/sản phẩm cụ thể)",
          "priceRange": "string (ví dụ: '3-8 triệu')",
          "description": "string (mô tả ngắn, đặc điểm)",
          "tips": "string (mẹo tiết kiệm hoặc lưu ý khi chọn)"
        }
      ],
      "budgetRecommendation": {
        "estimatedCost": number (VNĐ, mức đề xuất cho cặp đôi trung bình tại ${province}),
        "note": "string (giải thích cơ sở đề xuất)"
      },
      "budgetCategories": ${JSON.stringify(categories.find(c => c.id === 'placeholder')?.budgetCategories || [])}
    }
  ],
  "generalTips": ["string (3-5 tips tổng quát về cưới hỏi tại ${province})"],
  "bestTimeToBook": "string (thời điểm lý tưởng để đặt dịch vụ, thường bao nhiêu tháng trước đám cưới)"
}

Quan trọng:
- Giá phản ánh thực tế tại ${province}, KHÔNG dùng giá TPHCM/Hà Nội nếu tỉnh khác
- Mỗi section có 3-4 items cụ thể
- avgLow và avgHigh là số nguyên VNĐ (ví dụ: 5000000 là 5 triệu)
- budgetCategories cho mỗi section: ${categories.map(c => `"${c.id}" -> ${JSON.stringify(c.budgetCategories)}`).join(', ')}
- Đưa section "budgetCategories" đúng với mapping trên cho mỗi section`;

  const raw = await generateAIContent(user, SYSTEM_PROMPT, prompt, true);
  let parsed: any;
  try {
    const text = (raw || '').trim();
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Dữ liệu từ AI không hợp lệ. Vui lòng thử lại.');
  }

  // Enrich sections with budgetCategories from our mapping (in case AI omits)
  if (parsed.sections) {
    parsed.sections = parsed.sections.map((s: LocalMarketSection) => ({
      ...s,
      budgetCategories: categories.find(c => c.id === s.id)?.budgetCategories ?? s.budgetCategories ?? [],
    }));
  }

  return { ...parsed, generatedAt: new Date().toISOString() } as LocalMarketReport;
}
