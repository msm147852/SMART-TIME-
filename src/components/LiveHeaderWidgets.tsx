import React, { useState, useEffect, useRef } from 'react';
import {
  CloudSun,
  Sparkles,
  Trophy,
  Coins,
  Calendar,
  Clock,
  TrendingUp,
  X,
  Flame,
  Star,
  Activity,
  Calculator,
  Bitcoin,
  ChevronRight,
  ShieldCheck,
  Home,
} from 'lucide-react';
import { Language, UserProfile } from '../types';
import {
  MOCK_CRYPTO_RATES,
  MOCK_CURRENCY_GOLD_RATES,
  MOCK_SILVER_RATES,
  MOCK_GOLD_KARAT_RATES,
  MOCK_EGYPTIAN_LEAGUE_MATCHES,
  EGYPTIAN_LEAGUE_STANDINGS,
  GLOBAL_FOOTBALL_MATCHES,
  getMatchForFavoriteTeam,
  EXTENDED_CRYPTO_DATABASE,
  CryptoMarketItem,
  getZodiacDailyTip,
  calculateUserAge,
  getUserZodiac,
  getHijriDate,
  getGregorianDate,
} from '../utils/liveInfoHelpers';

interface LiveHeaderWidgetsProps {
  user: UserProfile;
  language: Language;
  onGoHome?: () => void;
  isHomeActive?: boolean;
}

export const LiveHeaderWidgets: React.FC<LiveHeaderWidgetsProps> = ({
  user,
  language,
  onGoHome,
  isHomeActive = false,
}) => {
  const [now, setNow] = useState(new Date());
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [silverCalcGrams, setSilverCalcGrams] = useState<number>(10);
  const [goldCalcGrams, setGoldCalcGrams] = useState<number>(10);
  const [goldCalcKarat, setGoldCalcKarat] = useState<string>('21');
  const pointerDownTimeRef = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isAr = language === 'ar';
  const age = calculateUserAge(user.birthDate);
  const zodiac = getUserZodiac(user.birthDate);
  const hijri = getHijriDate(now, language);
  const gregorian = getGregorianDate(now, language);

  const formattedTime = now.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // تفضيلات الشريط من الملف الشخصي مع قيم افتراضية متكاملة
  const prefs = user.tickerPreferences || {
    showTimeAndDate: true,
    showGold: true,
    showSilver: true,
    showZodiac: true,
    showEgyptianLeague: true,
    showCrypto: true,
    showCurrencies: true,
    showWeather: true,
    showCustomMessage: true,
    customMessage: 'وقتك من ذهب ⏳ استثمر يومك في طاعة الله والإنجاز',
    favoriteEgyptianTeam: 'الأهلي',
    silverUnit: '999',
    goldUnit: '21',
    selectedCryptos: ['BTC', 'ETH', 'SOL'],
    speed: 'slow',
  };

  // سرعة حركة شريط الأخبار المريح
  const getTickerDuration = () => {
    switch (prefs.speed) {
      case 'very_slow':
        return '55s';
      case 'medium':
        return '26s';
      case 'fast':
        return '17s';
      case 'slow':
      default:
        return '38s';
    }
  };

  const usdRate = MOCK_CURRENCY_GOLD_RATES[0];
  const sarRate = MOCK_CURRENCY_GOLD_RATES[4] || { pair: 'SAR / EGP', rate: 13.05, unit: 'ج.م', change: 0.02 };
  const aedRate = MOCK_CURRENCY_GOLD_RATES[5] || { pair: 'AED / EGP', rate: 13.34, unit: 'ج.م', change: 0.03 };
  
  // أسعار الذهب حسب اختيار المستخدم مع دعم كافة العيارات والسبائك
  const isAllGold = prefs.goldUnit === 'all';
  const selectedGoldItems = isAllGold
    ? [
        MOCK_GOLD_KARAT_RATES.find((g) => g.id === '21')!,
        MOCK_GOLD_KARAT_RATES.find((g) => g.id === '24')!,
        MOCK_GOLD_KARAT_RATES.find((g) => g.id === '18')!,
        MOCK_GOLD_KARAT_RATES.find((g) => g.id === 'pound')!,
      ].filter(Boolean)
    : [
        MOCK_GOLD_KARAT_RATES.find((g) => g.id === (prefs.goldUnit || '21')) ||
          MOCK_GOLD_KARAT_RATES[2],
      ];

  // العملات المشفرة المختارة في تفضيلات المستخدم (تشمل العملات المضافة والمختارة من النت)
  const userCryptoSymbols = (prefs.selectedCryptos && prefs.selectedCryptos.length > 0)
    ? prefs.selectedCryptos
    : ['BTC', 'ETH', 'SOL'];

  const allKnownCryptosMap = new Map<string, CryptoMarketItem>();
  EXTENDED_CRYPTO_DATABASE.forEach((c) => allKnownCryptosMap.set(c.symbol, c));
  (prefs.customCryptos || []).forEach((c) => allKnownCryptosMap.set(c.symbol, c));

  const selectedCryptosList: CryptoMarketItem[] = userCryptoSymbols.map((sym) => {
    return (
      allKnownCryptosMap.get(sym) || {
        id: sym.toLowerCase(),
        name: sym,
        nameAr: sym,
        nameEn: sym,
        symbol: sym,
        priceUsd: 1.0,
        change24h: 1.5,
        iconColor: '#f59e0b',
        iconSymbol: '🪙',
      }
    );
  });

  // أسعار الفضة حسب اختيار المستخدم
  const silverRate999 = MOCK_SILVER_RATES[0];
  const silverRate925 = MOCK_SILVER_RATES[1];
  const silverRateOz = MOCK_SILVER_RATES[3];
  const selectedSilver = prefs.silverUnit === '925' 
    ? silverRate925 
    : prefs.silverUnit === 'ounce' 
    ? silverRateOz 
    : silverRate999;

  // نصيحة وبرج المستخدم
  const zodiacTip = getZodiacDailyTip(user.zodiacSign || zodiac.nameAr, isAr);

  // مباريات فريقك المفضل (دعم الأندية العالمية والمحلية)
  const favTeam = prefs.favoriteTeam || prefs.favoriteEgyptianTeam || 'الأهلي';
  const highlightedMatch = getMatchForFavoriteTeam(favTeam);
  const otherMatches = GLOBAL_FOOTBALL_MATCHES.filter((m) => m.id !== highlightedMatch.id);

  // يتوقف الشريط فقط عند الوقوف عليه بالماوس أو الضغط واللمس بالأصبع
  const isPaused = isInteracting || activeModal !== null;

  const handleItemClick = (modalType: string) => {
    const pressDuration = Date.now() - pointerDownTimeRef.current;
    if (pressDuration < 280) {
      setActiveModal(modalType);
    }
  };

  // دالة تصيير الأرقام والبيانات في شريط الأخبار المباشرة
  const renderTickerItems = (keyPrefix: string) => (
    <div key={keyPrefix} className="flex items-center gap-2.5 px-3 shrink-0 whitespace-nowrap text-slate-700 dark:text-slate-300 font-semibold text-[11px] font-mono">
      
      {/* 1. التاريخ الهجري والميلادي */}
      {prefs.showTimeAndDate !== false && (
        <>
          <button
            onClick={() => handleItemClick('time')}
            className="flex items-center gap-1 hover:text-amber-500 cursor-pointer active:scale-95 transition-colors shrink-0"
            title={isAr ? 'التاريخ والتقويم (هجري وميلادي)' : 'Date & Calendar'}
          >
            <Calendar className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-sans font-bold">
              {hijri}
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-sans font-medium">
              {gregorian}
            </span>
          </button>
          <span className="text-slate-300 dark:text-slate-700 font-normal">/</span>
        </>
      )}

      {/* 2. سعر الفضة (جديد ومربوط بالملف الشخصي) */}
      {prefs.showSilver !== false && (
        <>
          <button
            onClick={() => handleItemClick('silver')}
            className="flex items-center gap-1 hover:text-slate-400 cursor-pointer active:scale-95 transition-colors shrink-0 bg-slate-100/70 dark:bg-slate-800/70 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-700"
            title={isAr ? 'أسعار الفضة' : 'Silver Rates'}
          >
            <span className="text-slate-400 font-bold">🥈</span>
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 font-sans">
              {isAr ? 'الفضة' : 'Silver'} ({selectedSilver.karat}):
            </span>
            <span className="font-bold font-mono text-slate-900 dark:text-white">
              {prefs.silverUnit === 'ounce' ? `$${selectedSilver.rateUsd}` : `${selectedSilver.rateEgp} ج.م`}
            </span>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono">
              +{selectedSilver.change}%
            </span>
          </button>
          <span className="text-slate-300 dark:text-slate-700 font-normal">/</span>
        </>
      )}

      {/* 3. أسعار الذهب (دعم جميع العيارات والجنيه والسبائك) */}
      {prefs.showGold !== false && (
        <>
          {selectedGoldItems.map((goldItem) => (
            <React.Fragment key={goldItem.id}>
              <button
                onClick={() => handleItemClick('gold')}
                className="flex items-center gap-1 hover:text-amber-500 cursor-pointer active:scale-95 transition-colors shrink-0 bg-amber-50/70 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/60"
                title={isAr ? `ذهب ${goldItem.nameAr} - انقر لعرض جميع العيارات وحاسبة الجرام` : `Gold ${goldItem.nameEn} - Click for all karats & calculator`}
              >
                <span className="text-amber-500 font-bold">🥇</span>
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 font-sans">
                  {isAr ? goldItem.nameAr : goldItem.nameEn}:
                </span>
                <span className="font-bold font-mono text-amber-950 dark:text-amber-200">
                  {goldItem.priceEgp ? `${goldItem.priceEgp.toLocaleString()} ج.م` : `$${goldItem.priceUsd}`}
                </span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono">
                  +{goldItem.change24h}
                </span>
              </button>
              <span className="text-slate-300 dark:text-slate-700 font-normal">/</span>
            </React.Fragment>
          ))}
        </>
      )}

      {/* 4. مباراة فريقك المفضل (أندية عالمية ومحلية) */}
      {(prefs.showEgyptianLeague !== false || prefs.showFavoriteTeam !== false) && (
        <>
          <button
            onClick={() => handleItemClick('league')}
            className="flex items-center gap-1.5 hover:text-emerald-500 cursor-pointer active:scale-95 transition-colors shrink-0 bg-emerald-50/70 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/60"
            title={isAr ? `فريقك المفضل (${favTeam}) - انقر لعرض جدول المباريات` : `Favorite Team (${favTeam}) - Click for scores`}
          >
            <Trophy className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 font-sans">
              {isAr ? 'فريقك المفضل' : 'Favorite'}:
            </span>
            <span className="font-bold font-sans text-slate-900 dark:text-white flex items-center gap-1">
              <span className={highlightMatchStyles(highlightedMatch.homeTeam, favTeam)}>
                {highlightedMatch.homeTeam}
              </span>
              <span className="font-mono bg-white dark:bg-slate-900 px-1 py-0.2 rounded text-[10px] text-emerald-600 font-bold">
                {highlightedMatch.homeScore} - {highlightedMatch.awayScore}
              </span>
              <span className={highlightMatchStyles(highlightedMatch.awayTeam, favTeam)}>
                {highlightedMatch.awayTeam}
              </span>
            </span>
            {highlightedMatch.leagueNameAr && (
              <span className="hidden sm:inline-flex items-center text-[9px] text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 px-1 rounded font-sans">
                {isAr ? highlightedMatch.leagueNameAr : highlightedMatch.leagueNameEn}
              </span>
            )}
            {otherMatches[0] && (
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-slate-500 font-sans ps-1 border-s border-emerald-200 dark:border-emerald-800">
                <span>{otherMatches[0].homeTeam} {otherMatches[0].homeScore}-{otherMatches[0].awayScore} {otherMatches[0].awayTeam}</span>
              </span>
            )}
          </button>
          <span className="text-slate-300 dark:text-slate-700 font-normal">/</span>
        </>
      )}

      {/* 5. برج المستخدم مع طاقة اليوم (جديد ومربوط بالملف الشخصي) */}
      {prefs.showZodiac !== false && (
        <>
          <button
            onClick={() => handleItemClick('zodiac')}
            className="flex items-center gap-1 hover:text-purple-500 cursor-pointer active:scale-95 transition-colors shrink-0 bg-purple-50/70 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-900/60"
            title={isAr ? 'برج المستخدم وطاقة اليوم' : 'User Zodiac & Energy'}
          >
            <Sparkles className="w-3 h-3 text-purple-500 shrink-0" />
            <span className="font-bold text-[10px] text-purple-700 dark:text-purple-300 font-sans">
              {user.zodiacSign || zodiac.nameAr} {zodiac.symbol}:
            </span>
            <span className="text-[10px] text-purple-900 dark:text-purple-200 font-sans font-medium max-w-[140px] truncate">
              {zodiacTip}
            </span>
          </button>
          <span className="text-slate-300 dark:text-slate-700 font-normal">/</span>
        </>
      )}

      {/* 6. العملات المشفرة الرقمية (اختيار المستخدم) */}
      {prefs.showCrypto !== false && (
        <>
          {selectedCryptosList.map((cryptoCoin) => (
            <React.Fragment key={cryptoCoin.id}>
              <button
                onClick={() => handleItemClick('crypto')}
                className="flex items-center gap-1 hover:text-amber-500 cursor-pointer active:scale-95 transition-colors shrink-0 bg-amber-500/5 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20"
                title={isAr ? `${cryptoCoin.nameAr} (${cryptoCoin.symbol}) - انقر لعرض قائمة العملات المشفرة` : `${cryptoCoin.nameEn} - Click for crypto market`}
              >
                <span className="text-amber-500 font-black">{cryptoCoin.iconSymbol || '🪙'}</span>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 font-mono">
                  {cryptoCoin.symbol}:
                </span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">
                  ${cryptoCoin.priceUsd.toLocaleString()}
                </span>
                <span
                  className={`text-[9px] font-mono ${
                    cryptoCoin.change24h >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-500'
                  }`}
                >
                  {cryptoCoin.change24h >= 0 ? `+${cryptoCoin.change24h}%` : `${cryptoCoin.change24h}%`}
                </span>
              </button>
              <span className="text-slate-300 dark:text-slate-700 font-normal">/</span>
            </React.Fragment>
          ))}
        </>
      )}

      {/* 7. العملات الأساسية (USD, SAR, AED) */}
      {prefs.showCurrencies !== false && (
        <>
          <button
            onClick={() => handleItemClick('rates')}
            className="flex items-center gap-1 hover:text-emerald-500 cursor-pointer active:scale-95 transition-colors shrink-0"
            title={isAr ? 'سعر صرف الدولار' : 'USD Rate'}
          >
            <span className="text-emerald-600 font-bold">$</span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
              USD:
            </span>
            <span className="font-bold font-mono text-slate-900 dark:text-white">
              {usdRate.rate}
            </span>
          </button>

          <span className="text-slate-300 dark:text-slate-700 font-normal">/</span>

          <button
            onClick={() => handleItemClick('rates')}
            className="flex items-center gap-1 hover:text-emerald-500 cursor-pointer active:scale-95 transition-colors shrink-0"
            title={isAr ? 'الريال السعودي' : 'SAR Rate'}
          >
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
              SAR:
            </span>
            <span className="font-bold font-mono text-slate-900 dark:text-white">
              {sarRate.rate}
            </span>
          </button>

          <span className="text-slate-300 dark:text-slate-700 font-normal">/</span>

          <button
            onClick={() => handleItemClick('rates')}
            className="flex items-center gap-1 hover:text-emerald-500 cursor-pointer active:scale-95 transition-colors shrink-0"
            title={isAr ? 'الدرهم الإماراتي' : 'AED Rate'}
          >
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
              AED:
            </span>
            <span className="font-bold font-mono text-slate-900 dark:text-white">
              {aedRate.rate}
            </span>
          </button>

          <span className="text-slate-300 dark:text-slate-700 font-normal">/</span>
        </>
      )}

      {/* 8. الطقس والحرارة */}
      {prefs.showWeather !== false && (
        <>
          <button
            onClick={() => handleItemClick('weather')}
            className="flex items-center gap-1 hover:text-sky-500 cursor-pointer active:scale-95 transition-colors shrink-0"
            title={isAr ? 'الطقس' : 'Weather'}
          >
            <CloudSun className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-bold font-mono text-sky-600 dark:text-sky-400">
              29°C
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">
              {user.city || (isAr ? 'القاهرة' : 'Cairo')}
            </span>
          </button>
          <span className="text-slate-300 dark:text-slate-700 font-normal">/</span>
        </>
      )}

      {/* 9. عبارة المستخدم المخصصة */}
      {prefs.showCustomMessage && prefs.customMessage && (
        <>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-sans font-bold shrink-0">
            <span>📢</span>
            <span>{prefs.customMessage}</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700 font-normal">/</span>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* حاوية شريط الأخبار مع زر الهوم الثابت على اليسار بحيث تخرج الأخبار منه متجهة لليمين */}
      <div
        className="relative w-full overflow-hidden select-none flex items-center bg-slate-50/90 dark:bg-slate-900/90 border-y border-slate-200/70 dark:border-slate-800/70 rounded-xl"
        id="live-ticker-strip-container"
        dir="ltr"
      >
        {/* زر الهوم الثابت فى أول شريط الأخبار من اليسار (تخرج منه الأخبار لليمين بانسيابية) */}
        <div className="z-20 shrink-0 flex items-center px-1.5 py-0.5 bg-slate-100/95 dark:bg-slate-900/95 border-r border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <button
            onClick={onGoHome}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-90 shrink-0 ${
              isHomeActive
                ? 'bg-amber-500 text-slate-950 font-black shadow-amber-500/30 ring-1 ring-amber-400'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-amber-500 hover:border-amber-400/50 border border-slate-200 dark:border-slate-700'
            }`}
            title={isAr ? 'الرئيسية — انقر للرجوع للشاشة الرئيسية' : 'Home — Click to go to Dashboard'}
            id="ticker-fixed-home-btn"
          >
            <Home className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-black">{isAr ? 'الرئيسية' : 'Home'}</span>
          </button>
          
          {/* مؤشر تدفق وانطلاق الأخبار من زر الهوم باتجاه اليمين */}
          <span className="ms-1 text-[11px] text-amber-500 font-bold animate-pulse select-none">
            ▶
          </span>
        </div>

        {/* مسار الأخبار المتحركة (خارجة من زر الهوم متجهة نحو اليمين) */}
        <div
          className="relative flex-1 overflow-hidden min-w-0 py-0.5"
          dir="ltr"
          onPointerDown={() => {
            pointerDownTimeRef.current = Date.now();
            setIsInteracting(true);
          }}
          onPointerUp={() => {
            setIsInteracting(false);
          }}
          onPointerCancel={() => setIsInteracting(false)}
          onPointerLeave={() => setIsInteracting(false)}
          onTouchStart={() => {
            pointerDownTimeRef.current = Date.now();
            setIsInteracting(true);
          }}
          onTouchEnd={() => {
            setIsInteracting(false);
          }}
          onTouchCancel={() => setIsInteracting(false)}
          onMouseEnter={() => setIsInteracting(true)}
          onMouseLeave={() => setIsInteracting(false)}
          title={
            isAr
              ? 'شريط الأخبار المخصص — اضغط للتوقف، وانقر على أي عنصر لمعرفة تفاصيله'
              : 'Customized Live Ticker — Press to hold, click any item for details'
          }
        >
          {/* تدرج تلاشي خروج الأخبار بسلاسة من جانب زر الهوم الأيسر */}
          <div
            className="absolute top-0 bottom-0 left-0 z-10 w-4 pointer-events-none bg-gradient-to-r from-slate-100 dark:from-slate-900 to-transparent"
          />

          {/* شريط التحريك المستمر باتجاه اليمين */}
          <div
            className="flex items-center animate-marquee-right"
            style={{
              animationPlayState: isPaused ? 'paused' : 'running',
              animationDuration: getTickerDuration(),
            }}
          >
            {renderTickerItems('track-a')}
            {renderTickerItems('track-b')}
          </div>
        </div>
      </div>

      {/* نافذة تفاصيل الفضة المنبثقة (Silver Modal) */}
      {activeModal === 'silver' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🥈</span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {isAr ? 'أسعار الفضة اليوم' : 'Silver Prices Today'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {isAr ? 'تحديث لحظي لعيارات الفضة والأونصة العالمية' : 'Live rates & ounce prices'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* بطاقات أسعار الفضة بالعيار */}
            <div className="space-y-2 mb-4">
              {MOCK_SILVER_RATES.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      {isAr ? item.titleAr : item.titleEn}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {item.karat === 'Ounce' ? 'XAG / USD' : `${isAr ? 'عيار' : 'Karat'} ${item.karat}`}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="font-bold font-mono text-xs text-slate-900 dark:text-white">
                      {item.rateUsd ? `$${item.rateUsd}` : `${item.rateEgp} ج.م`}
                    </div>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono">
                      +{item.change}% اليوم
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* حاسبة جرامات الفضة التفاعلية */}
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400 mb-2">
                <Calculator className="w-3.5 h-3.5" />
                <span>{isAr ? 'حاسبة قيمة الفضة السريعة' : 'Quick Silver Value'}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={silverCalcGrams}
                  onChange={(e) => setSilverCalcGrams(Math.max(1, Number(e.target.value)))}
                  className="w-20 p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-center font-bold text-xs"
                />
                <span className="text-slate-500">{isAr ? 'جرام فضة 999 =' : 'grams 999 ='}</span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                  {(silverCalcGrams * silverRate999.rateEgp).toLocaleString()} ج.م
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تفاصيل الدوري والمباريات العالمية والمحلية (League Modal) */}
      {activeModal === 'league' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-scaleUp max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  ⚽
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {isAr ? `مباريات اليوم وفريقك المفضل (${favTeam})` : `Matches & Favorite Club (${favTeam})`}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {isAr ? 'تغطية حية لأهم أندية العالم والبطولات المحلية والدولية' : 'Live coverage of global and local leagues'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* مباريات الجولة وأبرز المباريات العالمية والمحلية */}
            <div className="mb-4">
              <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isAr ? 'أهم المباريات والنتائج' : 'Key Match Fixtures'}</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {favTeam ? (isAr ? `فريقك: ${favTeam} ⭐` : `Team: ${favTeam} ⭐`) : ''}
                </span>
              </h4>
              <div className="space-y-2">
                {GLOBAL_FOOTBALL_MATCHES.map((match) => {
                  const isFav =
                    (favTeam && match.homeTeam.toLowerCase().includes(favTeam.toLowerCase())) ||
                    (favTeam && match.awayTeam.toLowerCase().includes(favTeam.toLowerCase()));
                  return (
                    <div
                      key={match.id}
                      className={`p-2.5 rounded-2xl border transition-all ${
                        isFav
                          ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                        <span className="font-semibold flex items-center gap-1.5">
                          {match.leagueNameAr && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                              {isAr ? match.leagueNameAr : match.leagueNameEn}
                            </span>
                          )}
                          <span>{match.roundAr}</span>
                          <span>•</span>
                          <span>{match.stadiumAr}</span>
                        </span>
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded-md ${
                            match.statusAr.includes('مباشر')
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {match.statusAr}
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-bold text-xs">
                        <div
                          className={`flex items-center gap-1.5 flex-1 ${
                            favTeam && match.homeTeam.toLowerCase().includes(favTeam.toLowerCase())
                              ? 'text-amber-600 dark:text-amber-400 font-black'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <span className="truncate">{match.homeTeam}</span>
                          {favTeam && match.homeTeam.toLowerCase().includes(favTeam.toLowerCase()) && (
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                          )}
                        </div>
                        <div className="px-3 py-1 bg-white dark:bg-slate-900 rounded-xl shadow-xs font-mono font-black text-sm text-emerald-600 dark:text-emerald-400 mx-2 shrink-0">
                          {match.homeScore} - {match.awayScore}
                        </div>
                        <div
                          className={`flex items-center justify-end gap-1.5 flex-1 ${
                            favTeam && match.awayTeam.toLowerCase().includes(favTeam.toLowerCase())
                              ? 'text-amber-600 dark:text-amber-400 font-black'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {favTeam && match.awayTeam.toLowerCase().includes(favTeam.toLowerCase()) && (
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                          )}
                          <span className="truncate">{match.awayTeam}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* جدول الترتيب المصغر */}
            <div>
              <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>{isAr ? 'صدارة جدول الترتيب' : 'League Standings'}</span>
              </h4>
              <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px]">
                <table className="w-full text-center">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-[10px]">
                    <tr>
                      <th className="py-1.5 px-2 text-start">#</th>
                      <th className="py-1.5 px-2 text-start">{isAr ? 'الفريق' : 'Team'}</th>
                      <th className="py-1.5 px-1">{isAr ? 'لعب' : 'P'}</th>
                      <th className="py-1.5 px-1">{isAr ? 'فوز' : 'W'}</th>
                      <th className="py-1.5 px-2 font-black text-amber-600">{isAr ? 'نقاط' : 'Pts'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {EGYPTIAN_LEAGUE_STANDINGS.map((team) => (
                      <tr
                        key={team.rank}
                        className={team.team.includes(favTeam) ? 'bg-amber-50/70 dark:bg-amber-950/40 font-bold' : ''}
                      >
                        <td className="py-1.5 px-2 text-start text-slate-400">{team.rank}</td>
                        <td className="py-1.5 px-2 text-start font-medium text-slate-900 dark:text-white">
                          {team.team}
                        </td>
                        <td className="py-1.5 px-1 text-slate-500">{team.played}</td>
                        <td className="py-1.5 px-1 text-emerald-600">{team.won}</td>
                        <td className="py-1.5 px-2 font-bold font-mono text-amber-600 dark:text-amber-400">
                          {team.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تفاصيل برج المستخدم (Zodiac Modal) */}
      {activeModal === 'zodiac' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-scaleUp text-xs"
            onClick={(e) => e.stopPropagation()}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{zodiac.symbol}</span>
                <div>
                  <h3 className="font-bold text-sm text-purple-600 dark:text-purple-400">
                    {user.zodiacSign || zodiac.nameAr}
                  </h3>
                  <p className="text-[10px] text-slate-400">{zodiac.datesAr} • {zodiac.elementAr}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span>{isAr ? 'رسالة وطاقة برجك لليوم' : 'Today\'s Astrological Energy'}</span>
                </div>
                <p className="text-xs leading-relaxed font-medium">
                  {zodiacTip}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block mb-0.5">{isAr ? 'العمر (ميلادي)' : 'Gregorian Age'}</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono text-[11px]">
                    {age.gregorianTextAr || `${age.years} سنة و ${age.months} شهر`}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block mb-0.5">{isAr ? 'العمر (هجري)' : 'Hijri Age'}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                    {age.hijriTextAr || `${age.years} سنة و ${age.months} شهر`}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl">
                💡 {isAr ? 'يمكنك تعديل تاريخ ميلادك وبرجك المفضل في أي وقت من الملف الشخصي ليتم تحديث الشريط تلقائياً.' : 'You can adjust birthdate and zodiac in your profile at any time.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تفاصيل الذهب والسبائك الشاملة (Gold Modal) */}
      {activeModal === 'gold' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-scaleUp max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  🥇
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {isAr ? 'بورصة أسعار الذهب والسبائك' : 'Gold Bullion & Karats Market'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {isAr ? 'تحديث لحظي لكافة العيارات والجنيه والأونصة مع حاسبة الجرامات' : 'Live rates for all karats, bullion & coin calculator'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* حاسبة أسعار الذهب الفورية */}
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-850">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isAr ? 'حاسبة قيمة الذهب السريعة' : 'Instant Gold Value Calculator'}</span>
                </span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                  {isAr ? 'سعر الذهب الصافي بدون مصنعية' : 'Raw gold estimate'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    {isAr ? 'الوزن (جرام):' : 'Weight (Grams):'}
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={goldCalcGrams}
                    onChange={(e) => setGoldCalcGrams(Math.max(0.1, parseFloat(e.target.value) || 0))}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    {isAr ? 'العيار:' : 'Karat:'}
                  </label>
                  <select
                    value={goldCalcKarat}
                    onChange={(e) => setGoldCalcKarat(e.target.value)}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    {MOCK_GOLD_KARAT_RATES.filter((g) => g.priceEgp && !g.id.startsWith('pound') && !g.id.startsWith('bar')).map((g) => (
                      <option key={g.id} value={g.id}>
                        {isAr ? g.nameAr : g.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <div className="p-2 rounded-xl bg-amber-500 text-slate-950 text-center font-bold">
                    <span className="text-[9px] block text-amber-950/80 font-medium">
                      {isAr ? 'القيمة الإجمالية التقديرية' : 'Estimated Total'}
                    </span>
                    <span className="text-sm font-mono font-extrabold">
                      {(() => {
                        const target = MOCK_GOLD_KARAT_RATES.find((g) => g.id === goldCalcKarat) || MOCK_GOLD_KARAT_RATES[2];
                        const total = (target.priceEgp || 3420) * goldCalcGrams;
                        return `${Math.round(total).toLocaleString()} ج.م`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* قائمة كافة عيارات الذهب والسبائك والجنيهات */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 block mb-1">
                {isAr ? 'أسعار جميع العيارات الرسمية اليوم:' : 'All Official Karats & Products Today:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MOCK_GOLD_KARAT_RATES.map((item) => (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between ${
                      (prefs.goldUnit === item.id || (prefs.goldUnit === 'all' && ['24', '21', 'pound'].includes(item.id)))
                        ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {isAr ? item.nameAr : item.nameEn}
                        </span>
                        {(prefs.goldUnit === item.id) && (
                          <span className="text-[9px] bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded-md">
                            {isAr ? 'المختار' : 'Active'}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        {item.priceUsd ? `عالمي: $${item.priceUsd}` : 'محلي معتمد'}
                      </span>
                    </div>

                    <div className="text-end">
                      <span className="font-mono font-extrabold text-xs text-amber-600 dark:text-amber-400 block">
                        {item.priceEgp ? `${item.priceEgp.toLocaleString()} ج.م` : `$${item.priceUsd}`}
                      </span>
                      <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        +{item.change24h} ج.م
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                {isAr
                  ? 'يمكنك تحديد العيار المفضل لديك (عيار 24، 21، 18 أو الجنيه الذهب) من نافذة الإعدادات ليظهر دائماً في الشريط.'
                  : 'You can set your preferred gold karat or coin from settings to display permanently in the ticker.'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تفاصيل العملات الرقمية المشفرة (Crypto Modal) */}
      {activeModal === 'crypto' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-scaleUp max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Bitcoin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {isAr ? 'سوق العملات الرقمية المشفرة (Crypto Market)' : 'Cryptocurrency Live Market'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {isAr
                      ? `أسعار حية بالدولار والجنيه المصري (سعر الصرف: ${usdRate.rate} ج.م)`
                      : `Live prices in USD & EGP (Pegged at ${usdRate.rate} EGP)`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* شبكة العملات المشفرة مع مقارنة بالجنيه المصري */}
            <div className="space-y-2">
              {(() => {
                const combinedCoinsMap = new Map<string, CryptoMarketItem>();
                selectedCryptosList.forEach((c) => combinedCoinsMap.set(c.symbol, c));
                EXTENDED_CRYPTO_DATABASE.forEach((c) => {
                  if (!combinedCoinsMap.has(c.symbol)) {
                    combinedCoinsMap.set(c.symbol, c);
                  }
                });
                const allModalCoins = Array.from(combinedCoinsMap.values());

                return allModalCoins.map((coin) => {
                  const isSelectedInTicker = (prefs.selectedCryptos || ['BTC', 'ETH', 'SOL']).includes(coin.symbol);
                  const egpPrice = Math.round(coin.priceUsd * (usdRate.rate || 48.65));
                  return (
                    <div
                      key={coin.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                        isSelectedInTicker
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-800/80 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-extrabold text-base">
                          {coin.iconSymbol || '🪙'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                              {coin.symbol}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {isAr ? coin.nameAr : coin.nameEn}
                            </span>
                            {isSelectedInTicker && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded-md">
                                {isAr ? 'في الشريط' : 'On Ticker'}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            ≈ {egpPrice.toLocaleString()} ج.م
                          </span>
                        </div>
                      </div>

                      <div className="text-end">
                        <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white block">
                          ${coin.priceUsd.toLocaleString()}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold ${
                            coin.change24h >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-500'
                          }`}
                        >
                          {coin.change24h >= 0 ? `+${coin.change24h}%` : `${coin.change24h}%`}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="mt-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-900 dark:text-amber-200 flex items-center justify-between">
              <span>
                {isAr
                  ? '💡 يمكنك تخصيص العملات المشفرة التي تظهر في شريط الأخبار من نافذة الإعدادات.'
                  : '💡 You can customize which crypto coins appear in the live ticker from settings.'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تفاصيل الأسعار العامة (Rates Modal) */}
      {activeModal === 'rates' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
              <span className="font-bold text-xs text-amber-600">
                {isAr ? 'تفاصيل أسعار الذهب والعملات' : 'Gold & Currency Rates'}
              </span>
              <button
                onClick={() => setActiveModal(null)}
                className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{isAr ? 'الذهب عيار 24' : 'Gold 24K'}</span>
                <span className="font-mono font-bold text-amber-600">
                  {MOCK_GOLD_KARAT_RATES[0].rateEgp} {MOCK_GOLD_KARAT_RATES[0].unitAr}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{isAr ? 'الذهب عيار 21' : 'Gold 21K'}</span>
                <span className="font-mono font-bold text-amber-600">
                  {MOCK_GOLD_KARAT_RATES[2].rateEgp} {MOCK_GOLD_KARAT_RATES[2].unitAr}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{isAr ? 'الفضة عيار 999' : 'Silver 999'}</span>
                <span className="font-mono font-bold text-slate-400">{silverRate999.rateEgp} ج.م</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Bitcoin (BTC)</span>
                <span className="font-mono font-bold text-amber-500">
                  ${MOCK_CRYPTO_RATES[0].priceUsd.toLocaleString()} (+{MOCK_CRYPTO_RATES[0].change24h}%)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Ethereum (ETH)</span>
                <span className="font-mono font-bold text-indigo-500">
                  ${MOCK_CRYPTO_RATES[1].priceUsd.toLocaleString()} (+{MOCK_CRYPTO_RATES[1].change24h}%)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">USD / EGP</span>
                <span className="font-mono font-bold text-emerald-600">{usdRate.rate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">SAR / EGP</span>
                <span className="font-mono font-bold text-emerald-600">{sarRate.rate}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">AED / EGP</span>
                <span className="font-mono font-bold text-emerald-600">{aedRate.rate}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تفاصيل الوقت والتقويم (Time Modal) */}
      {activeModal === 'time' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-xs w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
              <span className="font-bold text-xs text-amber-600">
                {isAr ? 'الوقت والتقويم' : 'Time & Calendar'}
              </span>
              <button
                onClick={() => setActiveModal(null)}
                className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{isAr ? 'الساعة' : 'Time'}</span>
                <span className="font-mono font-bold text-sm">{formattedTime}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{isAr ? 'التاريخ الهجري' : 'Hijri'}</span>
                <span className="font-bold text-amber-600">{hijri}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">{isAr ? 'التاريخ الميلادي' : 'Gregorian'}</span>
                <span className="font-mono">{gregorian}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تفاصيل الطقس (Weather Modal) */}
      {activeModal === 'weather' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-xs w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-scaleUp text-xs"
            onClick={(e) => e.stopPropagation()}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
              <span className="font-bold text-xs text-sky-600">
                {isAr ? 'حالة الطقس المباشرة' : 'Live Weather'}
              </span>
              <button
                onClick={() => setActiveModal(null)}
                className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{isAr ? 'المدينة' : 'City'}</span>
                <span className="font-bold">{user.city || (isAr ? 'القاهرة' : 'Cairo')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{isAr ? 'الحرارة' : 'Temperature'}</span>
                <span className="font-mono font-bold text-sky-600">29°C</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{isAr ? 'الحالة' : 'Condition'}</span>
                <span className="font-bold">{isAr ? 'مشمس وصافٍ' : 'Sunny & Clear'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">{isAr ? 'الرطوبة' : 'Humidity'}</span>
                <span className="font-mono font-bold">45%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// مساعدة لتمييز اسم الفريق المفضل
function highlightMatchStyles(teamName: string, favTeam: string): string {
  if (teamName.includes(favTeam)) {
    return 'text-amber-600 dark:text-amber-400 font-black';
  }
  return 'text-slate-800 dark:text-slate-200 font-bold';
}
