export interface ZodiacInfo {
  nameAr: string;
  nameEn: string;
  symbol: string;
  elementAr: string;
  elementEn: string;
  datesAr: string;
}

function parseLocalDate(dateStr?: string): Date {
  if (!dateStr) return new Date(1995, 8, 15);
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  return new Date(dateStr);
}

export function getUserZodiac(birthDateStr?: string): ZodiacInfo {
  const date = parseLocalDate(birthDateStr);
  const month = date.getMonth() + 1; // 1 - 12
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
    return { nameAr: 'برج الحمل', nameEn: 'Aries', symbol: '♈', elementAr: 'ناري', elementEn: 'Fire', datesAr: '21 مارس - 19 أبريل' };
  } else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
    return { nameAr: 'برج الثور', nameEn: 'Taurus', symbol: '♉', elementAr: 'ترابي', elementEn: 'Earth', datesAr: '20 أبريل - 20 مايو' };
  } else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
    return { nameAr: 'برج الجوزاء', nameEn: 'Gemini', symbol: '♊', elementAr: 'هوائي', elementEn: 'Air', datesAr: '21 مايو - 20 يونيو' };
  } else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
    return { nameAr: 'برج السرطان', nameEn: 'Cancer', symbol: '♋', elementAr: 'مائي', elementEn: 'Water', datesAr: '21 يونيو - 22 يوليو' };
  } else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
    return { nameAr: 'برج الأسد', nameEn: 'Leo', symbol: '♌', elementAr: 'ناري', elementEn: 'Fire', datesAr: '23 يوليو - 22 أغسطس' };
  } else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
    return { nameAr: 'برج العذراء', nameEn: 'Virgo', symbol: '♍', elementAr: 'ترابي', elementEn: 'Earth', datesAr: '23 أغسطس - 22 سبتمبر' };
  } else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
    return { nameAr: 'برج الميزان', nameEn: 'Libra', symbol: '♎', elementAr: 'هوائي', elementEn: 'Air', datesAr: '23 سبتمبر - 22 أكتوبر' };
  } else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
    return { nameAr: 'برج العقرب', nameEn: 'Scorpio', symbol: '♏', elementAr: 'مائي', elementEn: 'Water', datesAr: '23 أكتوبر - 21 نوفمبر' };
  } else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
    return { nameAr: 'برج القوس', nameEn: 'Sagittarius', symbol: '♐', elementAr: 'ناري', elementEn: 'Fire', datesAr: '22 نوفمبر - 21 ديسمبر' };
  } else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
    return { nameAr: 'برج الجدي', nameEn: 'Capricorn', symbol: '♑', elementAr: 'ترابي', elementEn: 'Earth', datesAr: '22 ديسمبر - 19 يناير' };
  } else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
    return { nameAr: 'برج الدلو', nameEn: 'Aquarius', symbol: '♒', elementAr: 'هوائي', elementEn: 'Air', datesAr: '20 يناير - 18 فبراير' };
  } else {
    return { nameAr: 'برج الحوت', nameEn: 'Pisces', symbol: '♓', elementAr: 'مائي', elementEn: 'Water', datesAr: '19 فبراير - 20 مارس' };
  }
}

export interface UserAgeDetail {
  years: number;
  months: number;
  // Gregorian
  gregorianYears: number;
  gregorianMonths: number;
  gregorianTextAr: string;
  gregorianTextEn: string;
  // Hijri
  hijriYears: number;
  hijriMonths: number;
  hijriTextAr: string;
  hijriTextEn: string;
  // Hijri birthdate representation
  hijriBirthDateAr: string;
  // Summary
  textAr: string;
  textEn: string;
}

function getHijriNumericParts(date: Date): { year: number; month: number; day: number } {
  try {
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const parts = formatter.formatToParts(date);
    let year = 1400;
    let month = 1;
    let day = 1;
    for (const part of parts) {
      if (part.type === 'year') {
        const val = parseInt(part.value.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(val)) year = val;
      }
      if (part.type === 'month') {
        const val = parseInt(part.value.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(val)) month = val;
      }
      if (part.type === 'day') {
        const val = parseInt(part.value.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(val)) day = val;
      }
    }
    return { year, month, day };
  } catch (e) {
    const totalDays = Math.max(0, (date.getTime() - new Date(622, 6, 16).getTime()) / (1000 * 60 * 60 * 24));
    const hYears = Math.floor(totalDays / 354.367);
    const remDays = totalDays - hYears * 354.367;
    const hMonths = Math.min(11, Math.floor(remDays / 29.53));
    return { year: hYears, month: hMonths + 1, day: 1 };
  }
}

export function calculateUserAge(birthDateStr?: string): UserAgeDetail {
  const birthDate = parseLocalDate(birthDateStr);
  const now = new Date();

  // Gregorian calculation
  let gYears = now.getFullYear() - birthDate.getFullYear();
  let gMonths = now.getMonth() - birthDate.getMonth();

  if (now.getDate() < birthDate.getDate()) {
    gMonths--;
  }
  if (gMonths < 0) {
    gYears--;
    gMonths += 12;
  }
  gYears = Math.max(0, gYears);
  gMonths = Math.max(0, gMonths);

  // Hijri calculation
  const nowH = getHijriNumericParts(now);
  const birthH = getHijriNumericParts(birthDate);

  let hYears = nowH.year - birthH.year;
  let hMonths = nowH.month - birthH.month;

  if (nowH.day < birthH.day) {
    hMonths--;
  }
  if (hMonths < 0) {
    hYears--;
    hMonths += 12;
  }
  hYears = Math.max(0, hYears);
  hMonths = Math.max(0, hMonths);

  const gregorianTextAr = `${gYears} سنة و ${gMonths} شهر`;
  const gregorianTextEn = `${gYears} yrs and ${gMonths} mos`;
  const hijriTextAr = `${hYears} سنة و ${hMonths} شهر`;
  const hijriTextEn = `${hYears} AH yrs and ${hMonths} mos`;

  const hijriBirthDateAr = getHijriDate(birthDate, 'ar');

  return {
    years: gYears,
    months: gMonths,
    gregorianYears: gYears,
    gregorianMonths: gMonths,
    gregorianTextAr,
    gregorianTextEn,
    hijriYears: hYears,
    hijriMonths: hMonths,
    hijriTextAr,
    hijriTextEn,
    hijriBirthDateAr,
    textAr: `${gregorianTextAr} (ميلادي) • ${hijriTextAr} (هجري)`,
    textEn: `${gregorianTextEn} (Gregorian) • ${hijriTextEn} (Hijri)`,
  };
}

export function getHijriDate(date: Date = new Date(), lang: string = 'ar'): string {
  try {
    const locale = lang === 'ar' ? 'ar-SA-u-ca-islamic-umalqura' : 'en-US-u-ca-islamic-umalqura';
    const formatter = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const formatted = formatter.format(date);
    return lang === 'ar' ? `${formatted} هـ` : `${formatted} AH`;
  } catch (e) {
    return lang === 'ar' ? '٢١ صفر ١٤٤٨ هـ' : '21 Safar 1448 AH';
  }
}

export function getGregorianDate(date: Date = new Date(), lang: string = 'ar'): string {
  return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export interface CryptoMarketItem {
  id: string;
  name: string;
  symbol: string;
  priceUsd: number;
  change24h: number;
  iconColor: string;
}

export interface CurrencyGoldRate {
  pair: string;
  rate: number;
  unit: string;
  change: number;
}

export interface SilverRateItem {
  id: string;
  titleAr: string;
  titleEn: string;
  karat: string;
  rateEgp: number;
  rateUsd?: number;
  unitAr: string;
  unitEn: string;
  change: number;
}

export const MOCK_SILVER_RATES: SilverRateItem[] = [
  { id: 'silver_999', titleAr: 'فضة نقية عيار 999', titleEn: 'Fine Silver 999', karat: '999', rateEgp: 54.20, unitAr: 'ج.م/جرام', unitEn: 'EGP/g', change: 0.35 },
  { id: 'silver_925', titleAr: 'فضة إسترليني عيار 925', titleEn: 'Sterling Silver 925', karat: '925', rateEgp: 49.80, unitAr: 'ج.م/جرام', unitEn: 'EGP/g', change: 0.25 },
  { id: 'silver_800', titleAr: 'فضة عيار 800', titleEn: 'Silver 800', karat: '800', rateEgp: 43.10, unitAr: 'ج.م/جرام', unitEn: 'EGP/g', change: 0.15 },
  { id: 'silver_oz', titleAr: 'أونصة الفضة عالمياً', titleEn: 'Silver Ounce (XAG)', karat: 'Ounce', rateEgp: 1578.50, rateUsd: 32.45, unitAr: 'دولار/أونصة', unitEn: 'USD/oz', change: 1.12 },
];

export interface EgyptianLeagueMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  statusAr: string;
  statusEn: string;
  roundAr: string;
  date: string;
  stadiumAr: string;
}

export const MOCK_EGYPTIAN_LEAGUE_MATCHES: EgyptianLeagueMatch[] = [
  {
    id: 'eg_m1',
    homeTeam: 'الأهلي',
    awayTeam: 'الزمالك',
    homeScore: 2,
    awayScore: 1,
    statusAr: 'انتهت',
    statusEn: 'Full Time',
    roundAr: 'قمة الدوري - الجولة 14',
    date: 'أمس',
    stadiumAr: 'ستاد القاهرة الدولي',
  },
  {
    id: 'eg_m2',
    homeTeam: 'بيراميدز',
    awayTeam: 'الإسماعيلي',
    homeScore: 3,
    awayScore: 0,
    statusAr: 'انتهت',
    statusEn: 'Full Time',
    roundAr: 'الجولة 14',
    date: 'أمس',
    stadiumAr: 'ستاد الدفاع الجوي',
  },
  {
    id: 'eg_m3',
    homeTeam: 'المصري',
    awayTeam: 'الاتحاد السكندري',
    homeScore: 1,
    awayScore: 1,
    statusAr: 'انتهت',
    statusEn: 'Full Time',
    roundAr: 'الجولة 14',
    date: 'اليوم',
    stadiumAr: 'ستاد برج العرب',
  },
  {
    id: 'eg_m4',
    homeTeam: 'سيراميكا',
    awayTeam: 'زد إف سي',
    homeScore: 2,
    awayScore: 1,
    statusAr: 'انتهت',
    statusEn: 'Full Time',
    roundAr: 'الجولة 14',
    date: 'اليوم',
    stadiumAr: 'ستاد المقاولون العرب',
  },
  {
    id: 'eg_m5',
    homeTeam: 'مودرن سبورت',
    awayTeam: 'سموحة',
    homeScore: 2,
    awayScore: 0,
    statusAr: 'انتهت',
    statusEn: 'Full Time',
    roundAr: 'الجولة 14',
    date: 'اليوم',
    stadiumAr: 'ستاد السلام',
  },
  {
    id: 'eg_m6',
    homeTeam: 'غزل المحلة',
    awayTeam: 'إنبي',
    homeScore: 1,
    awayScore: 1,
    statusAr: 'مباشر (د 78)',
    statusEn: 'Live 78\'',
    roundAr: 'الجولة 14',
    date: 'جارية الآن',
    stadiumAr: 'ستاد غزل المحلة',
  },
];

export const EGYPTIAN_LEAGUE_STANDINGS = [
  { rank: 1, team: 'الأهلي', played: 14, won: 10, drawn: 3, lost: 1, points: 33 },
  { rank: 2, team: 'بيراميدز', played: 14, won: 9, drawn: 4, lost: 1, points: 31 },
  { rank: 3, team: 'الزمالك', played: 14, won: 8, drawn: 4, lost: 2, points: 28 },
  { rank: 4, team: 'المصري', played: 14, won: 7, drawn: 4, lost: 3, points: 25 },
  { rank: 5, team: 'الاتحاد السكندري', played: 14, won: 6, drawn: 5, lost: 3, points: 23 },
  { rank: 6, team: 'سيراميكا كليوباترا', played: 14, won: 6, drawn: 3, lost: 5, points: 21 },
  { rank: 7, team: 'زد إف سي', played: 14, won: 5, drawn: 5, lost: 4, points: 20 },
  { rank: 8, team: 'الإسماعيلي', played: 14, won: 4, drawn: 5, lost: 5, points: 17 },
];

export function getZodiacDailyTip(signName: string, isAr: boolean = true): string {
  const tipsAr: Record<string, string> = {
    'برج الحمل': 'طاقة وحماس عالي لإنجاز مهامك القيادية اليوم',
    'برج الثور': 'يوم مناسب للقرارات المالية والاستثمار الهادئ',
    'برج الجوزاء': 'تواصل اجتماعي ممتاز وأفكار إبداعية متجددة',
    'برج السرطان': 'هدوء نفسي وراحة أسرية تدعم تركيزك اليومي',
    'برج الأسد': 'حضورك لافت وثقة كبيرة في تنفيذ المخططات',
    'برج العذراء': 'دقة عالية وتنظيم فائق يعزز إنجاز كل مسؤولياتك',
    'برج الميزان': 'توازن وتناغم يمنحك هدوءاً في كافة التعاملات',
    'برج العقرب': 'حدس قوي وقدرة استثنائية على حل التحديات المعقدة',
    'برج القوس': 'تفاؤل وتطلع مستقبلي يفتح لك آفاقاً جديدة',
    'برج الجدي': 'انضباط وعمل دؤوب يقربك من هدفك المهني',
    'برج الدلو': 'ابتكار ورؤية متطورة تجذب إعجاب المحيطين بك',
    'برج الحوت': 'إلهام مشاعري وحس إنساني راقٍ يثري يومك',
  };

  const tipsEn: Record<string, string> = {
    'Aries': 'High vitality and initiative for your leadership goals today',
    'Taurus': 'Favorable day for financial prudence and steady gains',
    'Gemini': 'Excellent communication skills and fresh creative insights',
    'Cancer': 'Peace of mind and warm family comfort anchor your day',
    'Leo': 'Bold confidence and charisma that inspires those around you',
    'Virgo': 'Superb precision and organization streamlining your tasks',
    'Libra': 'Harmonious balance and tact in all your negotiations',
    'Scorpio': 'Sharp intuition and focus cracking any complex challenge',
    'Sagittarius': 'Optimism and wide horizons elevating your spirits',
    'Capricorn': 'Steadfast discipline paving the way to solid progress',
    'Aquarius': 'Original ideas and forward thinking shining brightly',
    'Pisces': 'Gentle inspiration and empathy enriching your journey',
  };

  for (const key of Object.keys(tipsAr)) {
    if (signName.includes(key.replace('برج ', '')) || signName === key) {
      return isAr ? tipsAr[key] : (tipsEn[key] || tipsAr[key]);
    }
  }

  return isAr
    ? 'طاقة إيجابية عالية وتركيز مثمر لتحقيق أهدافك اليوم'
    : 'High positive energy and clarity powering your day';
}

export const MOCK_CRYPTO_RATES: CryptoMarketItem[] = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', priceUsd: 64120.5, change24h: 2.84, iconColor: '#f7931a' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', priceUsd: 2510.2, change24h: 1.92, iconColor: '#627eea' },
  { id: 'sol', name: 'Solana', symbol: 'SOL', priceUsd: 139.8, change24h: 3.45, iconColor: '#14f195' },
];

export const MOCK_CURRENCY_GOLD_RATES: CurrencyGoldRate[] = [
  { pair: 'USD / EGP', rate: 48.65, unit: 'ج.م', change: 0.1 },
  { pair: 'ذهب عيار 21', rate: 3420, unit: 'ج.م/جرام', change: 15 },
  { pair: 'EUR / EGP', rate: 52.80, unit: 'ج.م', change: -0.15 },
  { pair: 'ذهب عيار 24', rate: 3908, unit: 'ج.م/جرام', change: 20 },
  { pair: 'SAR / EGP', rate: 13.05, unit: 'ج.م', change: 0.02 },
  { pair: 'AED / EGP', rate: 13.34, unit: 'ج.م', change: 0.03 },
];
