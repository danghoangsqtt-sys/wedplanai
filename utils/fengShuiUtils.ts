// Dữ liệu Thiên Can
const CAN = ["Canh", "Tân", "Nhâm", "Quý", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ"];
// Dữ liệu Địa Chi
const CHI = ["Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi"];

export const getCanChi = (year: number) => {
    const can = CAN[year % 10];
    const chi = CHI[year % 12];
    return `${can} ${chi}`;
};

export const getCungMenh = (year: number, gender: 'MALE' | 'FEMALE'): { cung: string, hanh: string } => {
    let sum = 0;
    const digits = year.toString().split('').map(Number);
    digits.forEach(d => sum += d);

    let remainder = sum;
    while (remainder > 9) {
        remainder = Math.floor(remainder / 10) + (remainder % 10);
    }

    let cungSo = 0;
    if (year < 2000) {
        if (gender === 'MALE') cungSo = 11 - remainder;
        else cungSo = 4 + remainder;
    } else {
        if (gender === 'MALE') cungSo = 10 - remainder;
        else cungSo = 5 + remainder;
    }

    while (cungSo > 9) cungSo -= 9;
    if (cungSo === 0) cungSo = 9;
    if (cungSo === 5) {
        return gender === 'MALE' ? { cung: 'Khôn', hanh: 'Thổ' } : { cung: 'Cấn', hanh: 'Thổ' };
    }

    const CUNG_MAP: Record<number, { cung: string, hanh: string }> = {
        1: { cung: 'Khảm', hanh: 'Thủy' },
        2: { cung: 'Khôn', hanh: 'Thổ' },
        3: { cung: 'Chấn', hanh: 'Mộc' },
        4: { cung: 'Tốn', hanh: 'Mộc' },
        6: { cung: 'Càn', hanh: 'Kim' },
        7: { cung: 'Đoài', hanh: 'Kim' },
        8: { cung: 'Cấn', hanh: 'Thổ' },
        9: { cung: 'Ly', hanh: 'Hỏa' }
    };

    return CUNG_MAP[cungSo] || { cung: 'Không rõ', hanh: '' };
};

export const getNguHanhNapAm = (year: number): string => {
    const NAP_AM: Record<number, string> = {
        1980: "Thạch Lựu Mộc", 1981: "Thạch Lựu Mộc",
        1982: "Đại Hải Thủy", 1983: "Đại Hải Thủy",
        1984: "Hải Trung Kim", 1985: "Hải Trung Kim",
        1986: "Lư Trung Hỏa", 1987: "Lư Trung Hỏa",
        1988: "Đại Lâm Mộc", 1989: "Đại Lâm Mộc",
        1990: "Lộ Bàng Thổ", 1991: "Lộ Bàng Thổ",
        1992: "Kiếm Phong Kim", 1993: "Kiếm Phong Kim",
        1994: "Sơn Đầu Hỏa", 1995: "Sơn Đầu Hỏa",
        1996: "Giản Hạ Thủy", 1997: "Giản Hạ Thủy",
        1998: "Thành Đầu Thổ", 1999: "Thành Đầu Thổ",
        2000: "Bạch Lạp Kim", 2001: "Bạch Lạp Kim",
        2002: "Dương Liễu Mộc", 2003: "Dương Liễu Mộc",
        2004: "Tuyền Trung Thủy", 2005: "Tuyền Trung Thủy",
        2006: "Ốc Thượng Thổ", 2007: "Ốc Thượng Thổ",
        2008: "Tích Lịch Hỏa", 2009: "Tích Lịch Hỏa"
    };
    return NAP_AM[year] || "Tra cứu sau";
};

// --- MỚI: TÍNH THẦN SỐ HỌC & CUNG HOÀNG ĐẠO ---

export const getZodiacSign = (day: number, month: number): string => {
    if ((month == 1 && day <= 19) || (month == 12 && day >= 22)) return "Ma Kết";
    if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return "Bảo Bình";
    if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return "Song Ngư";
    if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return "Bạch Dương";
    if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return "Kim Ngưu";
    if ((month == 5 && day >= 21) || (month == 6 && day <= 21)) return "Song Tử";
    if ((month == 6 && day >= 22) || (month == 7 && day <= 22)) return "Cự Giải";
    if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return "Sư Tử";
    if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return "Xử Nữ";
    if ((month == 9 && day >= 23) || (month == 10 && day <= 23)) return "Thiên Bình";
    if ((month == 10 && day >= 24) || (month == 11 && day <= 21)) return "Bọ Cạp";
    if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return "Nhân Mã";
    return "Không rõ";
};

export const getLifePathNumber = (dateStr: string): number => {
    // Date format: YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length !== 3) return 0;

    const digits = parts.join('').split('').map(Number);
    let sum = digits.reduce((a, b) => a + b, 0);

    // Rút gọn về 1 chữ số (trừ số 11, 22 - Master Numbers)
    while (sum > 9 && sum !== 11 && sum !== 22) {
        let tempSum = 0;
        while (sum > 0) {
            tempSum += sum % 10;
            sum = Math.floor(sum / 10);
        }
        sum = tempSum;
    }
    return sum;
};