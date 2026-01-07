import { Lunar, Solar } from 'lunar-javascript';

export interface VietnamHoliday {
  date: string; // ISO format YYYY-MM-DD
  name: string;
  type: 'public' | 'traditional' | 'commemorative';
  isLunar: boolean;
  description?: string;
  daysOff?: number; // Số ngày nghỉ chính thức (nếu có)
}

/**
 * Tính ngày lễ Việt Nam cho một năm
 * Bao gồm cả ngày lễ dương lịch và âm lịch (tự động chuyển đổi)
 */
export function getVietnamHolidays(year: number): VietnamHoliday[] {
  const holidays: VietnamHoliday[] = [];

  // ========== NGÀY LỄ DƯƠNG LỊCH (CỐ ĐỊNH) ==========
  
  // Tết Dương lịch
  holidays.push({
    date: `${year}-01-01`,
    name: 'Tết Dương lịch',
    type: 'public',
    isLunar: false,
    description: 'Ngày đầu năm mới dương lịch',
    daysOff: 1,
  });

  // Ngày Giỗ Tổ Hùng Vương (10/3 âm lịch) - sẽ tính bên dưới

  // Ngày Giải phóng miền Nam
  holidays.push({
    date: `${year}-04-30`,
    name: 'Ngày Giải phóng miền Nam',
    type: 'public',
    isLunar: false,
    description: 'Ngày thống nhất đất nước (30/4/1975)',
    daysOff: 1,
  });

  // Ngày Quốc tế Lao động
  holidays.push({
    date: `${year}-05-01`,
    name: 'Ngày Quốc tế Lao động',
    type: 'public',
    isLunar: false,
    description: 'Ngày Quốc tế Lao động',
    daysOff: 1,
  });

  // Ngày Quốc khánh
  holidays.push({
    date: `${year}-09-02`,
    name: 'Ngày Quốc khánh',
    type: 'public',
    isLunar: false,
    description: 'Ngày Độc lập (2/9/1945)',
    daysOff: 2, // 2/9 và 1 ngày liền kề
  });

  // ========== NGÀY LỄ ÂM LỊCH (TỰ ĐỘNG CHUYỂN ĐỔI) ==========

  // Tết Nguyên Đán (Mùng 1 - Mùng 5 Tết)
  const tetDates = getLunarToSolarDates(year, 1, 1, 5); // Tháng 1 âm, ngày 1-5
  tetDates.forEach((date, index) => {
    holidays.push({
      date,
      name: index === 0 ? 'Tết Nguyên Đán (Mùng 1)' : 
            index === 1 ? 'Tết Nguyên Đán (Mùng 2)' :
            index === 2 ? 'Tết Nguyên Đán (Mùng 3)' :
            index === 3 ? 'Tết Nguyên Đán (Mùng 4)' : 'Tết Nguyên Đán (Mùng 5)',
      type: 'public',
      isLunar: true,
      description: 'Tết cổ truyền Việt Nam',
      daysOff: index < 5 ? 1 : 0,
    });
  });

  // Giao thừa (30 Tết hoặc 29 Tết nếu tháng thiếu)
  const giaoThuaDate = getGiaoThuaDate(year);
  if (giaoThuaDate) {
    holidays.push({
      date: giaoThuaDate,
      name: 'Giao thừa (Đêm 30 Tết)',
      type: 'public',
      isLunar: true,
      description: 'Đêm giao thừa - đón năm mới âm lịch',
      daysOff: 1,
    });
  }

  // Ngày Giỗ Tổ Hùng Vương (10/3 âm lịch)
  const hungVuongDate = getLunarToSolar(year, 3, 10);
  if (hungVuongDate) {
    holidays.push({
      date: hungVuongDate,
      name: 'Giỗ Tổ Hùng Vương',
      type: 'public',
      isLunar: true,
      description: 'Ngày Giỗ Tổ Hùng Vương (10/3 âm lịch)',
      daysOff: 1,
    });
  }

  // ========== NGÀY LỄ TRUYỀN THỐNG (KHÔNG NGHỈ) ==========

  // Tết Nguyên tiêu (Rằm tháng Giêng - 15/1 âm)
  const nguyenTieuDate = getLunarToSolar(year, 1, 15);
  if (nguyenTieuDate) {
    holidays.push({
      date: nguyenTieuDate,
      name: 'Tết Nguyên tiêu',
      type: 'traditional',
      isLunar: true,
      description: 'Rằm tháng Giêng - Lễ hội đèn lồng',
    });
  }

  // Tết Hàn thực (3/3 âm lịch)
  const hanThucDate = getLunarToSolar(year, 3, 3);
  if (hanThucDate) {
    holidays.push({
      date: hanThucDate,
      name: 'Tết Hàn thực',
      type: 'traditional',
      isLunar: true,
      description: 'Ngày bánh trôi bánh chay (3/3 âm lịch)',
    });
  }

  // Tết Đoan Ngọ (5/5 âm lịch)
  const doanNgoDate = getLunarToSolar(year, 5, 5);
  if (doanNgoDate) {
    holidays.push({
      date: doanNgoDate,
      name: 'Tết Đoan Ngọ',
      type: 'traditional',
      isLunar: true,
      description: 'Tết diệt sâu bọ (5/5 âm lịch)',
    });
  }

  // Lễ Vu Lan (15/7 âm lịch)
  const vuLanDate = getLunarToSolar(year, 7, 15);
  if (vuLanDate) {
    holidays.push({
      date: vuLanDate,
      name: 'Lễ Vu Lan',
      type: 'traditional',
      isLunar: true,
      description: 'Lễ báo hiếu - Rằm tháng 7 (15/7 âm lịch)',
    });
  }

  // Tết Trung Thu (15/8 âm lịch)
  const trungThuDate = getLunarToSolar(year, 8, 15);
  if (trungThuDate) {
    holidays.push({
      date: trungThuDate,
      name: 'Tết Trung Thu',
      type: 'traditional',
      isLunar: true,
      description: 'Tết thiếu nhi - Rằm tháng 8 (15/8 âm lịch)',
    });
  }

  // Tết Táo Quân (23/12 âm lịch)
  const taoQuanDate = getLunarToSolar(year, 12, 23);
  if (taoQuanDate) {
    holidays.push({
      date: taoQuanDate,
      name: 'Tết Táo Quân',
      type: 'traditional',
      isLunar: true,
      description: 'Ngày tiễn Táo Quân về trời (23/12 âm lịch)',
    });
  }

  // ========== NGÀY KỶ NIỆM ==========

  // Valentine
  holidays.push({
    date: `${year}-02-14`,
    name: 'Ngày Valentine',
    type: 'commemorative',
    isLunar: false,
    description: 'Ngày lễ tình nhân',
  });

  // Ngày Quốc tế Phụ nữ
  holidays.push({
    date: `${year}-03-08`,
    name: 'Ngày Quốc tế Phụ nữ',
    type: 'commemorative',
    isLunar: false,
    description: 'Ngày Quốc tế Phụ nữ 8/3',
  });

  // Ngày Phụ nữ Việt Nam
  holidays.push({
    date: `${year}-10-20`,
    name: 'Ngày Phụ nữ Việt Nam',
    type: 'commemorative',
    isLunar: false,
    description: 'Ngày Phụ nữ Việt Nam 20/10',
  });

  // Ngày Nhà giáo Việt Nam
  holidays.push({
    date: `${year}-11-20`,
    name: 'Ngày Nhà giáo Việt Nam',
    type: 'commemorative',
    isLunar: false,
    description: 'Ngày Nhà giáo Việt Nam 20/11',
  });

  // Giáng sinh
  holidays.push({
    date: `${year}-12-24`,
    name: 'Đêm Giáng sinh',
    type: 'commemorative',
    isLunar: false,
    description: 'Đêm Noel',
  });

  holidays.push({
    date: `${year}-12-25`,
    name: 'Giáng sinh',
    type: 'commemorative',
    isLunar: false,
    description: 'Lễ Giáng sinh',
  });

  // Sắp xếp theo ngày
  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Chuyển đổi ngày âm lịch sang dương lịch
 */
function getLunarToSolar(solarYear: number, lunarMonth: number, lunarDay: number): string | null {
  try {
    // Tìm năm âm lịch tương ứng
    // Nếu là tháng 1-2 âm lịch, có thể rơi vào năm dương lịch trước
    let lunarYear = solarYear;
    
    // Đối với Tết (tháng 1 âm), cần xác định năm âm lịch
    if (lunarMonth <= 2) {
      // Kiểm tra xem Tết năm này rơi vào tháng nào dương lịch
      const lunar = Lunar.fromYmd(solarYear, lunarMonth, lunarDay);
      const solar = lunar.getSolar();
      
      // Nếu ngày dương lịch > tháng 3, nghĩa là ta đang dùng sai năm
      if (solar.getMonth() > 3) {
        lunarYear = solarYear - 1;
      }
    }
    
    const lunar = Lunar.fromYmd(lunarYear, lunarMonth, lunarDay);
    const solar = lunar.getSolar();
    
    const month = String(solar.getMonth()).padStart(2, '0');
    const day = String(solar.getDay()).padStart(2, '0');
    
    return `${solar.getYear()}-${month}-${day}`;
  } catch (error) {
    console.error(`Error converting lunar date ${lunarMonth}/${lunarDay}:`, error);
    return null;
  }
}

/**
 * Lấy nhiều ngày âm lịch liên tiếp
 */
function getLunarToSolarDates(solarYear: number, lunarMonth: number, startDay: number, count: number): string[] {
  const dates: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const date = getLunarToSolar(solarYear, lunarMonth, startDay + i);
    if (date) {
      dates.push(date);
    }
  }
  
  return dates;
}

/**
 * Lấy ngày Giao thừa (30 hoặc 29 tháng Chạp)
 */
function getGiaoThuaDate(solarYear: number): string | null {
  try {
    // Tìm ngày cuối cùng của tháng 12 âm lịch năm trước
    // Giao thừa năm 2026 là cuối tháng 12 âm lịch năm 2025
    const lunarYear = solarYear - 1;
    
    // Thử ngày 30 trước
    try {
      const lunar30 = Lunar.fromYmd(lunarYear, 12, 30);
      const solar = lunar30.getSolar();
      const month = String(solar.getMonth()).padStart(2, '0');
      const day = String(solar.getDay()).padStart(2, '0');
      return `${solar.getYear()}-${month}-${day}`;
    } catch {
      // Nếu không có ngày 30 (tháng thiếu), lấy ngày 29
      const lunar29 = Lunar.fromYmd(lunarYear, 12, 29);
      const solar = lunar29.getSolar();
      const month = String(solar.getMonth()).padStart(2, '0');
      const day = String(solar.getDay()).padStart(2, '0');
      return `${solar.getYear()}-${month}-${day}`;
    }
  } catch (error) {
    console.error('Error getting Giao Thua date:', error);
    return null;
  }
}

/**
 * Lấy ngày lễ cho một khoảng thời gian
 */
export function getHolidaysInRange(startDate: string, endDate: string): VietnamHoliday[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  
  let allHolidays: VietnamHoliday[] = [];
  
  // Lấy ngày lễ cho tất cả các năm trong khoảng
  for (let year = startYear; year <= endYear; year++) {
    allHolidays = [...allHolidays, ...getVietnamHolidays(year)];
  }
  
  // Lọc những ngày trong khoảng
  return allHolidays.filter(h => h.date >= startDate && h.date <= endDate);
}

/**
 * Kiểm tra một ngày có phải ngày lễ không
 */
export function getHolidayByDate(date: string): VietnamHoliday | null {
  const year = new Date(date).getFullYear();
  const holidays = getVietnamHolidays(year);
  return holidays.find(h => h.date === date) || null;
}

/**
 * Kiểm tra có phải ngày nghỉ lễ chính thức không
 */
export function isPublicHoliday(date: string): boolean {
  const holiday = getHolidayByDate(date);
  return holiday?.type === 'public';
}

/**
 * Chuyển ngày dương lịch sang âm lịch
 */
export function getSolarToLunar(date: string): { year: number; month: number; day: number; monthName: string } | null {
  try {
    const d = new Date(date);
    const solar = Solar.fromYmd(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const lunar = solar.getLunar();
    
    return {
      year: lunar.getYear(),
      month: lunar.getMonth(),
      day: lunar.getDay(),
      monthName: lunar.getMonthInChinese(),
    };
  } catch (error) {
    console.error('Error converting to lunar:', error);
    return null;
  }
}

/**
 * Lấy thông tin âm lịch dạng text
 */
export function getLunarDateText(date: string): string {
  const lunar = getSolarToLunar(date);
  if (!lunar) return '';
  return `${lunar.day}/${lunar.month} ÂL`;
}
