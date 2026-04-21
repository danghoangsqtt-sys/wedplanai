
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

export interface DetectedLocation {
  province: string | null;
  district: string | null;
}

export async function detectLocation(): Promise<DetectedLocation> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve({ province: null, district: null }); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=vi&addressdetails=1`,
            { headers: { 'Accept-Language': 'vi' } }
          );
          const data = await res.json();
          // Province
          const rawProvince = data.address?.state || data.address?.city || '';
          const normalizedProvince = rawProvince.replace(/^(Tỉnh|Thành phố)\s+/i, '').trim();
          const matchProvince = VIETNAM_PROVINCES.find(p =>
            p === normalizedProvince ||
            p.includes(normalizedProvince) ||
            normalizedProvince.includes(p.replace('TP. ', ''))
          );
          // District
          const rawDistrict = data.address?.county || data.address?.city_district || data.address?.town || data.address?.suburb || '';
          const normalizedDistrict = rawDistrict
            .replace(/^(Huyện|Quận|Thị xã|Thành phố)\s+/i, '')
            .trim();

          resolve({
            province: matchProvince || normalizedProvince || null,
            district: normalizedDistrict || null
          });
        } catch {
          resolve({ province: null, district: null });
        }
      },
      () => resolve({ province: null, district: null }),
      { timeout: 8000 }
    );
  });
}

const SYSTEM_PROMPT = `Bạn là chuyên gia tư vấn dịch vụ đám cưới tại Việt Nam với 20 năm kinh nghiệm thực tế.
Bạn nắm rõ mức giá, thị trường, phong tục và đặc điểm chi tiết đến CẤP HUYỆN/QUẬN/THỊ XÃ của từng tỉnh thành trên khắp 3 miền Bắc - Trung - Nam.
Bạn hiểu sự khác biệt giá giữa trung tâm thành phố và vùng huyện ngoại thành.
Chỉ trả về JSON hợp lệ, không có markdown, không có text ngoài JSON.`;

// --- HELPERS ---

/** Safely extract JSON from AI response (handles fences, thinking tokens, truncation) */
function extractJSON(raw: string | undefined): any {
  let text = (raw || '').trim();
  if (!text) throw new Error('AI trả về kết quả rỗng. Vui lòng thử lại.');

  // Strip markdown code fences
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

  // Strip leading non-JSON characters (thinking tokens, preamble...)
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('AI không trả về JSON hợp lệ. Vui lòng thử lại.');
  }
  text = text.slice(jsonStart, jsonEnd + 1);

  try {
    return JSON.parse(text);
  } catch {
    // Attempt to fix common truncation issues (missing closing brackets)
    let fixed = text;
    const opens = (fixed.match(/\[/g) || []).length;
    const closes = (fixed.match(/\]/g) || []).length;
    for (let i = 0; i < opens - closes; i++) fixed += ']';
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    for (let i = 0; i < openBraces - closeBraces; i++) fixed += '}';

    try {
      return JSON.parse(fixed);
    } catch {
      throw new Error('Dữ liệu từ AI không hợp lệ (JSON parse thất bại). Thử giảm số danh mục hoặc thử lại.');
    }
  }
}

/** Validate that parsed report has the expected structure */
function validateReport(parsed: any, province: string): void {
  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('AI trả về dữ liệu thiếu mục "sections". Vui lòng thử lại.');
  }
  if (parsed.sections.length === 0) {
    throw new Error('AI trả về danh sách sections rỗng. Vui lòng thử lại.');
  }
  // Ensure required top-level fields exist with fallbacks
  if (!parsed.province) parsed.province = province;
  if (!parsed.region) parsed.region = 'SOUTH';
  if (!parsed.economicLevel) parsed.economicLevel = 'MID';
  if (!parsed.generalTips) parsed.generalTips = [];
  if (!parsed.bestTimeToBook) parsed.bestTimeToBook = 'Nên đặt trước 3-6 tháng';
}

/** Build location label for display and prompts */
function locationLabel(province: string, district?: string): string {
  return district ? `${district}, ${province}` : province;
}

/** Build the prompt for a set of categories */
function buildPrompt(province: string, categories: MarketCategory[], district?: string): string {
  const loc = locationLabel(province, district);
  const districtNote = district
    ? `\n- ĐÂY LÀ YÊU CẦU CẤP HUYỆN/QUẬN: Giá phải phản ánh chính xác mức giá tại "${district}" thuộc "${province}", KHÔNG dùng giá trung bình toàn tỉnh.\n- Nếu "${district}" là huyện ngoại thành / vùng nông thôn → giá thường THẤP HƠN trung tâm tỉnh.\n- Nếu "${district}" là quận nội thành / thị xã phát triển → giá có thể TƯƠNG ĐƯƠNG hoặc CAO HƠN.\n- Đề cập nhà cung cấp, studio, nhà hàng PHỔ BIẾN tại ${district} nếu biết.`
    : '';

  return `Cung cấp thông tin thị trường dịch vụ cưới CHI TIẾT tại "${loc}" cho các danh mục sau:
${categories.map(c => `- ${c.id}: ${c.label}`).join('\n')}

Trả về JSON với cấu trúc CHÍNH XÁC sau (không thêm trường nào khác):
{
  "province": "${province}",
  "district": "${district || ''}",
  "region": "NORTH" | "CENTRAL" | "SOUTH",
  "economicLevel": "HIGH" | "MID" | "LOW",
  "generatedAt": "${new Date().toISOString()}",
  "sections": [
    {
      "id": "string (khớp id danh mục)",
      "label": "string",
      "emoji": "string",
      "summary": "string (2-3 câu mô tả đặc điểm thị trường tại ${loc}, đề cập giá cả CỤ THỂ cho khu vực này, số lượng nhà cung cấp, lưu ý đặc thù địa phương)",
      "avgLow": number (VNĐ, mức giá thấp điển hình TẠI ${loc}),
      "avgHigh": number (VNĐ, mức giá cao điển hình TẠI ${loc}),
      "priceNote": "string (ghi chú đơn vị tính, ví dụ: 'triệu/cặp', 'triệu/bộ ảnh')",
      "items": [
        {
          "name": "string (tên dịch vụ/sản phẩm cụ thể, ưu tiên nhà cung cấp tại ${loc})",
          "priceRange": "string (ví dụ: '3-8 triệu')",
          "description": "string (mô tả ngắn, đặc điểm tại ${loc})",
          "tips": "string (mẹo tiết kiệm hoặc lưu ý khi chọn tại ${loc})"
        }
      ],
      "budgetRecommendation": {
        "estimatedCost": number (VNĐ, mức đề xuất cho cặp đôi trung bình tại ${loc}),
        "note": "string (giải thích cơ sở đề xuất, so sánh với trung tâm tỉnh nếu là huyện)"
      },
      "budgetCategories": ["ví dụ: Trang Sức"]
    }
  ],
  "generalTips": ["string (3-5 tips tổng quát về cưới hỏi tại ${loc})"],
  "bestTimeToBook": "string (thời điểm lý tưởng để đặt dịch vụ tại ${loc})"
}

Quan trọng:
- Giá phản ánh thực tế tại ${loc}, KHÔNG dùng giá chung toàn quốc${districtNote}
- Mỗi section có 3-4 items cụ thể
- avgLow và avgHigh là số nguyên VNĐ (ví dụ: 5000000 là 5 triệu)
- budgetCategories cho mỗi section: ${categories.map(c => `"${c.id}" -> ${JSON.stringify(c.budgetCategories)}`).join(', ')}
- Đưa section "budgetCategories" đúng với mapping trên cho mỗi section`;
}

// --- MAX CATEGORIES PER BATCH (avoid output token overflow) ---
const MAX_CATEGORIES_PER_BATCH = 5;

export async function generateLocalMarketReport(
  province: string,
  selectedCategoryIds: string[],
  user: UserProfile,
  district?: string
): Promise<LocalMarketReport> {
  const categories = MARKET_CATEGORIES.filter(c => selectedCategoryIds.includes(c.id));
  if (!categories.length) throw new Error('Chưa chọn danh mục nào.');

  // If categories fit in one batch, call once
  if (categories.length <= MAX_CATEGORIES_PER_BATCH) {
    return await fetchAndParse(province, categories, user, district);
  }

  // Split into batches to avoid output token overflow
  const batches: MarketCategory[][] = [];
  for (let i = 0; i < categories.length; i += MAX_CATEGORIES_PER_BATCH) {
    batches.push(categories.slice(i, i + MAX_CATEGORIES_PER_BATCH));
  }

  // Fetch all batches (sequentially to be gentle on rate limits)
  let mergedReport: LocalMarketReport | null = null;

  for (const batch of batches) {
    const partial = await fetchAndParse(province, batch, user, district);

    if (!mergedReport) {
      mergedReport = partial;
    } else {
      // Merge sections from subsequent batches
      mergedReport.sections.push(...partial.sections);
    }
  }

  return mergedReport!;
}

/** Fetch one batch of categories and return a parsed, validated report */
async function fetchAndParse(
  province: string,
  categories: MarketCategory[],
  user: UserProfile,
  district?: string
): Promise<LocalMarketReport> {
  const prompt = buildPrompt(province, categories, district);
  const raw = await generateAIContent(user, SYSTEM_PROMPT, prompt, true);

  const parsed = extractJSON(raw);
  validateReport(parsed, province);

  // Ensure district is preserved
  if (district && !parsed.district) parsed.district = district;

  // Enrich sections with budgetCategories from our mapping (in case AI omits)
  if (parsed.sections) {
    parsed.sections = parsed.sections.map((s: LocalMarketSection) => ({
      ...s,
      budgetCategories: categories.find(c => c.id === s.id)?.budgetCategories ?? s.budgetCategories ?? [],
    }));
  }

  return { ...parsed, generatedAt: new Date().toISOString() } as LocalMarketReport;
}
