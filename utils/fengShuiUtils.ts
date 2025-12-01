// Dữ liệu Thiên Can
const CAN = ["Canh", "Tân", "Nhâm", "Quý", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ"];
// Dữ liệu Địa Chi (Đã sửa lỗi thiếu dấu ngoặc kép ở chữ "Tỵ")
const CHI = ["Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi"];

export const getCanChi = (year: number) => {
    const can = CAN[year % 10];
    const chi = CHI[year % 12];
    return `${can} ${chi}`;
};

export const getCungMenh = (year: number, gender: 'MALE' | 'FEMALE'): { cung: string, hanh: string } => {
    let sum = 0;
    const digits = year.toString().split('').map(Number);
    // Tổng các chữ số
    digits.forEach(d => sum += d);

    // Rút gọn tổng về 1 chữ số (Ví dụ 1999 -> 28 -> 10 -> 1)
    let remainder = sum;
    while (remainder > 9) {
        remainder = Math.floor(remainder / 10) + (remainder % 10);
    }

    let cungSo = 0;
    // Công thức cho năm 1900 - 1999
    // (Lưu ý: Năm 2000 trở đi công thức sẽ khác, tạm thời dùng logic phổ biến này)
    if (year < 2000) {
        if (gender === 'MALE') cungSo = 11 - remainder;
        else cungSo = 4 + remainder;
    } else {
        // Công thức cho năm 2000 - 2099
        if (gender === 'MALE') cungSo = 10 - remainder;
        else cungSo = 5 + remainder;
    }

    // Rút gọn lại nếu > 9 hoặc <= 0
    while (cungSo > 9) cungSo -= 9;
    if (cungSo === 0) cungSo = 9;
    if (cungSo === 5) {
        // Trường hợp cung trung 5: Nam là Khôn, Nữ là Cấn
        return gender === 'MALE'
            ? { cung: 'Khôn', hanh: 'Thổ' }
            : { cung: 'Cấn', hanh: 'Thổ' };
    }

    // Bảng tra Cung Bát Trạch
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

// Hàm tra Mệnh (Ngũ Hành Nạp Âm)
export const getNguHanhNapAm = (year: number): string => {
    // Bảng tra nhanh cho các năm sinh phổ biến (1980 - 2005)
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
        2004: "Tuyền Trung Thủy", 2005: "Tuyền Trung Thủy"
    };

    return NAP_AM[year] || "Tra cứu sau";
};