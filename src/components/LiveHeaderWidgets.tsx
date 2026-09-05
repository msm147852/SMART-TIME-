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
  Home,
} from 'lucide-react';
import { Language, UserProfile } from '../types';
import {
  MOCK_CRYPTO_RATES,
  MOCK_CURRENCY_GOLD_RATES,
  MOCK_SILVER_RATES,
  MOCK_EGYPTIAN_LEAGUE_MATCHES,
  EGYPTIAN_LEAGUE_STANDINGS,
  getZodiacDailyTip,
  calculateUserAge,
  getUserZodiac,
  getHijriDate,
  getGregorianDate,
} from '../utils/liveInfoHelpers';

interface LiveHeaderWidgetsProps {
  user: UserProfile;
  language: Language;
  onHome?: () => void;
  isHomeActive?: boolean;
}

export const LiveHeaderWidgets: React.FC<LiveHeaderWidgetsProps> = ({
  user,
  language,
  onHome,
  isHomeActive,
}) => {
  const [now, setNow] = useState(new Date());
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [silverCalcGrams, setSilverCalcGrams] = useState<number>(10);
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
    goldUnit: '24',
    tickerSpeed: 'slow',
  };

  // مدة دورة الحركة (كلما زادت الثواني كانت الحركة أبطأ وأكثر راحة للقراءة)
  const TICKER_SPEED_DURATIONS: Record<string, string> = {
    verySlow: '55s',
    slow: '38s',
    medium: '25s',
    fast: '17s',
  };
  const tickerDuration = TICKER_SPEED_DURATIONS[prefs.tickerSpeed || 'slow'];

  const btcRate = MOCK_CRYPTO_RATES[0];
  const ethRate = MOCK_CRYPTO_RATES[1];
  const usdRate = MOCK_CURRENCY_GOLD_RATES[0];
  const sarRate = MOCK_CURRENCY_GOLD_RATES[4] || { pair: 'SAR / EGP', rate: 13.05, unit: 'ج.م', change: 0.02 };
  const aedRate = MOCK_CURRENCY_GOLD_RATES[5] || { pair: 'AED / EGP', rate: 13.34, unit: 'ج.م', change: 0.03 };
  
  // أسعار الذهب حسب اختيار المستخدم
  const goldRate24 = MOCK_CURRENCY_GOLD_RATES[3] || { pair: 'ذهب عيار 24', rate: 3908, unit: 'ج.م/جرام', change: 20 };
  const goldRate21 = MOCK_CURRENCY_GOLD_RATES[1] || { pair: 'ذهب عيار 21', rate: 3420, unit: 'ج.م/جرام', change: 15 };
  const selectedGold = prefs.goldUnit === '21' ? goldRate21 : goldRate24;

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

  // مباريات الدوري المصري مع إبراز الفريق المفضل
  const favTeam = prefs.favoriteEgyptianTeam || 'الأهلي';
  const highlightedMatch = MOCK_EGYPTIAN_LEAGUE_MATCHES.find(
    (m) => m.homeTeam.includes(favTeam) || m.awayTeam.includes(favTeam)
  ) || MOCK_EGYPTIAN_LEAGUE_MATCHES[0];

  const otherMatches = MOCK_EGYPTIAN_LEAGUE_MATCHES.filter((m) => m.id !== highlightedMatch.id);

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
      
      {/* الوقت والتاريخ الآن مثبتان في بداية الشريط ولا يتحركان مع الأخبار */}

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

      {/* 3. سعر الذهب */}
      {prefs.showGold !== false && (
        <>
          <button
            onClick={() => handleItemClick('rates')}
            className="flex items-center gap-1 hover:text-amber-500 cursor-pointer active:scale-95 transition-colors shrink-0 bg-amber-50/70 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/60"
            title={isAr ? 'أسعار الذهب' : 'Gold Rate'}
          >
            <span className="text-amber-500 font-bold">🥇</span>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 font-sans">
              {selectedGold.pair}:
            </span>
            <span className="font-bold font-mono text-amber-950 dark:text-amber-200">
              {selectedGold.rate} {selectedGold.unit}
            </span>
          </button>
          <span className="text-slate-300 dark:text-slate-700 font-normal">/</span>
        </>
      )}

      {/* 4. أهم نتائج مباريات الدوري المصري الممتاز (جديد ومربوط بالملف الشخصي) */}
      {prefs.showEgyptianLeague !== false && (
        <>
          <button
            onClick={() => handleItemClick('league')}
            className="flex items-center gap-1.5 hover:text-emerald-500 cursor-pointer active:scale-95 transition-colors shrink-0 bg-emerald-50/70 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/60"
            title={isAr ? 'نتائج الدوري المصري الممتاز' : 'Egyptian Premier League'}
          >
            <Trophy className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 font-sans">
              {isAr ? 'الدوري المصري' : 'Egypt League'}:
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
            {otherMatches[0] && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-500 font-sans ps-1 border-s border-emerald-200 dark:border-emerald-800">
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

      {/* 6. بيتكوين BTC */}
      {prefs.showCrypto !== false && (
        <>
          <button
            onClick={() => handleItemClick('rates')}
            className="flex items-center gap-1 hover:text-amber-500 cursor-pointer active:scale-95 transition-colors shrink-0"
            title={isAr ? 'بيتكوين' : 'Bitcoin'}
          >
            <span className="text-amber-500 font-black">₿</span>
            <span className="font-bold font-mono text-slate-900 dark:text-white">
              ${btcRate.priceUsd.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
              +{btcRate.change24h}%
            </span>
          </button>
          <span className="text-slate-300 dark:text-slate-700 font-normal">/</span>

          {/* إيثيريوم ETH */}
          <button
            onClick={() => handleItemClick('rates')}
            className="flex items-center gap-1 hover:text-indigo-400 cursor-pointer active:scale-95 transition-colors shrink-0"
            title={isAr ? 'إيثيريوم' : 'Ethereum'}
          >
            <span className="text-indigo-500 font-bold">Ξ</span>
            <span className="font-bold font-mono text-slate-900 dark:text-white">
              ${ethRate.priceUsd.toLocaleString()}
            </span>
          </button>
          <span className="text-slate-300 dark:text-slate-700 font-normal">/</span>
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
      {/* حاوية شر��ط الأخبار المتحرك لليمين مع الإيقاف الفوري عند اللمس واستئناف الحركة فور الإفلات */}
      <div
        className="relative w-full overflow-hidden select-none py-0.5 bg-slate-50/50 dark:bg-slate-900/50 border-y border-slate-200/60 dark:border-slate-800/60"
        id="live-ticker-strip-container"
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
        {/* شريط التحريك المستمر: الأخبار تخرج من خلف لوحة الهوم الثابتة */}
        <div
          className={`${isAr ? 'animate-marquee-left' : 'animate-marquee-right'} flex items-center`}
          style={{
            animationPlayState: isPaused ? 'paused' : 'running',
            animationDuration: tickerDuration,
          }}
        >
          {renderTickerItems('track-a')}
          {renderTickerItems('track-b')}
        </div>

        {/* لوحة ثابتة في بداية الشريط: زر الهوم + الساعة، والأخبار تخرج من خلفها */}
        <div
          className={`absolute inset-y-0 start-0 z-20 flex items-center gap-1.5 pe-5 ps-1 ${
            isAr
              ? 'bg-gradient-to-l from-slate-100 via-slate-100 to-transparent dark:from-slate-950 dark:via-slate-950 dark:to-transparent'
              : 'bg-gradient-to-r from-slate-100 via-slate-100 to-transparent dark:from-slate-950 dark:via-slate-950 dark:to-transparent'
          }`}
          dir={isAr ? 'rtl' : 'ltr'}
        >
          {onHome && (
            <button
              onClick={onHome}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-95 shrink-0 ${
                isHomeActive
                  ? 'bg-amber-500 text-slate-950 shadow-xs shadow-amber-500/30'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-amber-500'
              }`}
              title={isAr ? 'الرئيسية (Home)' : 'Home'}
              id="ticker-home-btn"
            >
              <Home className="w-3.5 h-3.5" />
            </button>
          )}

          {prefs.showTimeAndDate !== false && (
            <button
              onClick={() => handleItemClick('time')}
              className="flex items-center gap-1 shrink-0 active:scale-95 transition-transform"
              title={isAr ? 'الوقت والتاريخ' : 'Time & Date'}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="flex flex-col leading-none items-start">
                <span className="font-bold text-[11px] text-slate-900 dark:text-white font-mono">
                  {formattedTime}
                </span>
                <span className="text-[8px] text-amber-600 dark:text-amber-400 font-sans font-bold truncate max-w-[74px]">
                  {hijri}
                </span>
              </div>
            </button>
          )}
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

      {/* نافذة تفاصيل الدوري المصري الممتاز (League Modal) */}
      {activeModal === 'league' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-scaleUp max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                  ⚽
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {isAr ? 'الدوري المصري الممتاز (نايل)' : 'Egyptian Premier League'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {isAr ? `فريقك المفضل: ${favTeam} | الجولة 14` : `Favorite: ${favTeam} | Round 14`}
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

            {/* مباريات الجولة الحالية */}
            <div className="mb-4">
              <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isAr ? 'أهم نتائج ومباريات الجولة' : 'Key Round Fixtures'}</span>
              </h4>
              <div className="space-y-2">
                {MOCK_EGYPTIAN_LEAGUE_MATCHES.map((match) => {
                  const isFav = match.homeTeam.includes(favTeam) || match.awayTeam.includes(favTeam);
                  return (
                    <div
                      key={match.id}
                      className={`p-2.5 rounded-2xl border transition-all ${
                        isFav
                          ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                        <span className="font-medium">{match.roundAr} • {match.stadiumAr}</span>
                        <span className={`font-bold px-1.5 py-0.5 rounded-md ${
                          match.statusAr.includes('مباشر') 
                            ? 'bg-red-500 text-white animate-pulse' 
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          {match.statusAr}
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-bold text-xs">
                        <div className={`flex items-center gap-1.5 flex-1 ${match.homeTeam.includes(favTeam) ? 'text-amber-600 dark:text-amber-400 font-black' : 'text-slate-800 dark:text-slate-200'}`}>
                          <span>{match.homeTeam}</span>
                          {match.homeTeam.includes(favTeam) && <Star className="w-3 h-3 fill-amber-500 text-amber-500" />}
                        </div>
                        <div className="px-3 py-1 bg-white dark:bg-slate-900 rounded-xl shadow-xs font-mono font-black text-sm text-emerald-600 dark:text-emerald-400 mx-2">
                          {match.homeScore} - {match.awayScore}
                        </div>
                        <div className={`flex items-center justify-end gap-1.5 flex-1 ${match.awayTeam.includes(favTeam) ? 'text-amber-600 dark:text-amber-400 font-black' : 'text-slate-800 dark:text-slate-200'}`}>
                          {match.awayTeam.includes(favTeam) && <Star className="w-3 h-3 fill-amber-500 text-amber-500" />}
                          <span>{match.awayTeam}</span>
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
                <span className="font-mono font-bold text-amber-600">{goldRate24.rate} {goldRate24.unit}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{isAr ? 'الذهب عيار 21' : 'Gold 21K'}</span>
                <span className="font-mono font-bold text-amber-600">{goldRate21.rate} {goldRate21.unit}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{isAr ? 'الفضة عيار 999' : 'Silver 999'}</span>
                <span className="font-mono font-bold text-slate-400">{silverRate999.rateEgp} ج.م</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Bitcoin (BTC)</span>
                <span className="font-mono font-bold text-amber-500">${btcRate.priceUsd.toLocaleString()} (+{btcRate.change24h}%)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Ethereum (ETH)</span>
                <span className="font-mono font-bold text-indigo-500">${ethRate.priceUsd.toLocaleString()}</span>
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
