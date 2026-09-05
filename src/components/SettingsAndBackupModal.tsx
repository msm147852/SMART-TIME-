import React, { useState, useRef } from 'react';
import {
  Settings,
  X,
  Download,
  Upload,
  RotateCcw,
  User,
  Shield,
  Palette,
  Globe,
  DollarSign,
  Check,
  AlertTriangle,
  Smartphone,
  Sparkles,
  Trophy,
  Coins,
  Car,
  Utensils,
  BookOpen,
  Clock,
  Heart,
  Sliders,
  Bell,
  Activity,
  Layers,
  Camera,
  ImagePlus,
  Trash2,
  CheckCircle2,
  Bitcoin,
  CalendarDays,
  Search,
  Plus,
  Globe2,
  Loader2,
  Star,
} from 'lucide-react';
import {
  UserProfile,
  Language,
  ThemeMode,
  CurrencyType,
  ReligiousPreference,
  TickerPreferences,
  VehiclePreferences,
  BudgetPreferences,
  ReligiousDetails,
  FoodPreferences,
  EducationPreferences,
} from '../types';
import { translations } from '../services/i18n';
import { BackupRepository, UserRepository } from '../services';
import {
  calculateUserAge,
  getUserZodiac,
  getDaysUntilNextBirthday,
  getZodiacDailyTip,
  MOCK_GOLD_KARAT_RATES,
  MOCK_CRYPTO_RATES,
  MOCK_SILVER_RATES,
  POPULAR_TEAMS_CATEGORIES,
  ALL_POPULAR_TEAMS,
  searchCryptosOnline,
  EXTENDED_CRYPTO_DATABASE,
  CryptoMarketItem,
} from '../utils/liveInfoHelpers';

interface SettingsAndBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  theme: ThemeMode;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onLanguageChange: (lang: Language) => void;
  onThemeChange: (theme: ThemeMode) => void;
  onDataReset: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
];

const EGYPTIAN_TEAMS = ALL_POPULAR_TEAMS;

const ZODIAC_LIST = [
  'برج الحمل',
  'برج الثور',
  'برج الجوزاء',
  'برج السرطان',
  'برج الأسد',
  'برج العذراء',
  'برج الميزان',
  'برج العقرب',
  'برج القوس',
  'برج الجدي',
  'برج الدلو',
  'برج الحوت',
];

export const SettingsAndBackupModal: React.FC<SettingsAndBackupModalProps> = ({
  isOpen,
  onClose,
  language,
  theme,
  userProfile,
  onUpdateProfile,
  onLanguageChange,
  onThemeChange,
  onDataReset,
}) => {
  const t = translations[language];
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<
    'profile' | 'ticker' | 'sections' | 'preferences' | 'backup'
  >('profile');

  // 1. البيانات الشخصية
  const [name, setName] = useState(userProfile.name || '');
  const [email, setEmail] = useState(userProfile.email || '');
  const [phone, setPhone] = useState(userProfile.phone || '+20 100 123 4567');
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl || AVATAR_PRESETS[0]);
  const [country, setCountry] = useState(userProfile.country || 'مصر');
  const [city, setCity] = useState(userProfile.city || 'القاهرة');
  const [gender, setGender] = useState<'male' | 'female'>(userProfile.gender || 'male');
  const [occupation, setOccupation] = useState(userProfile.occupation || 'مهندس برمجيات ورائد أعمال');
  const [birthDate, setBirthDate] = useState(userProfile.birthDate || '1995-09-15');
  const [zodiacSign, setZodiacSign] = useState(userProfile.zodiacSign || 'برج العذراء');
  const [currency, setCurrency] = useState<CurrencyType>(userProfile.currency || 'EGP');
  const [pin, setPin] = useState(userProfile.pin || '1234');
  const [relPref, setRelPref] = useState<ReligiousPreference>(userProfile.religiousPreference || 'islam');

  // مرجع إدخال ملف الصورة وتحميلها من الهاتف
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // حساب العمر والبرج التلقائي الدقيق من تاريخ الميلاد
  const calculatedAge = calculateUserAge(birthDate);
  const calculatedZodiac = getUserZodiac(birthDate);
  const daysUntilBirthday = getDaysUntilNextBirthday(birthDate);

  // معالجة وضغط صورة المستخدم من الهاتف أو الكاميرا
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError(isAr ? 'يرجى اختيار ملف صورة صالح (JPG, PNG, WebP)' : 'Please select a valid image file');
      return;
    }
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) return;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          setAvatarUrl(compressed);
          showToast(isAr ? 'تم حفظ واختيار صورتك من هاتفك بنجاح!' : 'Avatar photo loaded from device!');
        } else {
          setAvatarUrl(src);
        }
      };
      img.onerror = () => {
        setUploadError(isAr ? 'تعذر معالجة الصورة، يرجى تجربة صورة أخرى' : 'Failed to process image');
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // 2. تفضيلات شريط الأخبار المباشرة
  const initialTicker: TickerPreferences = {
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
    favoriteEgyptianTeam: userProfile.tickerPreferences?.favoriteTeam || userProfile.tickerPreferences?.favoriteEgyptianTeam || 'الأهلي',
    favoriteTeam: userProfile.tickerPreferences?.favoriteTeam || userProfile.tickerPreferences?.favoriteEgyptianTeam || 'الأهلي',
    silverUnit: '999',
    goldUnit: '24',
    selectedCryptos: ['BTC', 'ETH', 'SOL'],
    speed: 'slow',
    customCryptos: [],
    ...(userProfile.tickerPreferences || {}),
  };

  const [tickerPrefs, setTickerPrefs] = useState<TickerPreferences>(initialTicker);

  // حالة البحث عن العملات الرقمية عبر الإنترنت
  const [cryptoSearchQuery, setCryptoSearchQuery] = useState('');
  const [isSearchingCryptoOnline, setIsSearchingCryptoOnline] = useState(false);
  const [cryptoSearchResults, setCryptoSearchResults] = useState<CryptoMarketItem[]>([]);
  const [isCryptoDropdownOpen, setIsCryptoDropdownOpen] = useState(false);

  // حالة اختيار أو كتابة فريق مخصص
  const [isCustomTeamOpen, setIsCustomTeamOpen] = useState(false);
  const [customTeamInput, setCustomTeamInput] = useState('');

  // دالة البحث التفاعلي عن العملات عبر النت
  const handleSearchCrypto = async (q: string) => {
    setCryptoSearchQuery(q);
    if (!q.trim()) {
      setCryptoSearchResults([]);
      return;
    }
    setIsSearchingCryptoOnline(true);
    try {
      const results = await searchCryptosOnline(q);
      setCryptoSearchResults(results);
    } catch (err) {
      console.error('Crypto search error:', err);
    } finally {
      setIsSearchingCryptoOnline(false);
    }
  };

  // دالة إضافة عملة مشفرة من نتائج البحث أو النت إلى التفضيلات
  const handleAddCrypto = (coin: CryptoMarketItem) => {
    const currentSelected = tickerPrefs.selectedCryptos || ['BTC', 'ETH', 'SOL'];
    const currentCustom = tickerPrefs.customCryptos || [];

    if (currentSelected.includes(coin.symbol)) {
      showToast(isAr ? `عملة ${coin.symbol} مضافة بالفعل` : `${coin.symbol} already selected`);
      return;
    }

    const nextSelected = [...currentSelected, coin.symbol];
    const isMock = MOCK_CRYPTO_RATES.some((c) => c.symbol === coin.symbol);
    const nextCustom = isMock || currentCustom.some((c) => c.symbol === coin.symbol)
      ? currentCustom
      : [...currentCustom, coin];

    setTickerPrefs({
      ...tickerPrefs,
      selectedCryptos: nextSelected,
      customCryptos: nextCustom,
    });

    setCryptoSearchQuery('');
    setCryptoSearchResults([]);
    setIsCryptoDropdownOpen(false);
    showToast(isAr ? `تمت إضافة عملة ${coin.symbol} بنجاح لشريط الأخبار!` : `Added ${coin.symbol} to ticker!`);
  };

  // دالة حذف عملة مشفرة من القائمة
  const handleRemoveCrypto = (symbol: string) => {
    const currentSelected = tickerPrefs.selectedCryptos || ['BTC', 'ETH', 'SOL'];
    if (currentSelected.length <= 1) {
      showToast(isAr ? 'يجب الإبقاء على عملة مشفرة واحدة على الأقل' : 'Keep at least one coin');
      return;
    }
    const nextSelected = currentSelected.filter((s) => s !== symbol);
    setTickerPrefs({ ...tickerPrefs, selectedCryptos: nextSelected });
  };

  // 3. تفضيلات الأقسام
  const [vehiclePrefs, setVehiclePrefs] = useState<VehiclePreferences>(
    userProfile.vehiclePreferences || {
      primaryVehicleName: 'تويوتا كورولا 2023',
      fuelType: 'gasoline95',
      serviceIntervalKm: 10000,
    }
  );

  const [budgetPrefs, setBudgetPrefs] = useState<BudgetPreferences>(
    userProfile.budgetPreferences || {
      monthlyBudgetLimit: 25000,
      alertThresholdPercent: 80,
      defaultPaymentMethod: 'instapay',
    }
  );

  const [relDetails, setRelDetails] = useState<ReligiousDetails>(
    userProfile.religiousDetails || {
      reciter: 'الشيخ محمود خليل الحصري',
      prayerCalculationMethod: 'الهيئة المصرية العامة للمساحة',
      athkarReminderEnabled: true,
    }
  );

  const [foodPrefs, setFoodPrefs] = useState<FoodPreferences>(
    userProfile.foodPreferences || {
      dietType: 'balanced',
      favoriteDish: 'كشري مصري بيتي وصينية بطاطس بالدجاج',
      autoAddToShoppingList: true,
    }
  );

  const [eduPrefs, setEduPrefs] = useState<EducationPreferences>(
    userProfile.educationPreferences || {
      defaultGradeLevel: 'الصف الثالث الإعدادي',
      homeworkAlerts: true,
    }
  );

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle Export Backup
  const handleExportBackup = () => {
    const jsonString = BackupRepository.exportFullBackupJSON();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-time-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(isAr ? 'تم تصدير النسخة الاحتياطية بنجاح!' : 'Backup exported successfully!');
  };

  // Handle Import Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const success = BackupRepository.importFullBackupJSON(content);
      if (success) {
        showToast(isAr ? 'تم استعادة البيانات بنجاح!' : 'Backup restored successfully!');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        alert(isAr ? 'ملف النسخة الاحتياطية غير صالح' : 'Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  // Handle Save All Settings
  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated: UserProfile = {
      ...userProfile,
      name,
      email,
      phone,
      avatarUrl,
      country,
      city,
      gender,
      occupation,
      currency,
      pin,
      pinCode: pin,
      religiousPreference: relPref,
      birthDate,
      zodiacSign: calculatedZodiac.nameAr,
      tickerPreferences: tickerPrefs,
      vehiclePreferences: vehiclePrefs,
      budgetPreferences: budgetPrefs,
      religiousDetails: relDetails,
      foodPreferences: foodPrefs,
      educationPreferences: eduPrefs,
    };
    onUpdateProfile(updated);
    UserRepository.saveProfile(updated);
    showToast(isAr ? 'تم حفظ التعديلات وربطها فوراً مع شريط الأخبار!' : 'Settings saved and synced to ticker!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 max-h-[92vh] flex flex-col overflow-hidden"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-xs shadow-amber-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                {isAr ? 'الملف الشخصي وإعدادات الأقسام' : 'User Profile & Preferences'}
              </h2>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'تحكم كامل في بياناتك، شريط الأخبار، وتفضيلات كافة أقسام التطبيق'
                  : 'Manage personal data, news ticker items, and all app modules'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Tabs */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl shrink-0 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{isAr ? 'البيانات الشخصية' : 'Profile'}</span>
          </button>

          <button
            onClick={() => setActiveTab('ticker')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'ticker'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isAr ? 'شريط الأخبار والأسعار' : 'News Ticker'}</span>
          </button>

          <button
            onClick={() => setActiveTab('sections')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'sections'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>{isAr ? 'تفضيلات الأقسام' : 'Modules'}</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'preferences'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{isAr ? 'المظهر واللغة' : 'Appearance'}</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'backup'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{isAr ? 'النسخ والبيانات' : 'Backup'}</span>
          </button>
        </div>

        {/* Feedback Toast */}
        {toastMessage && (
          <div className="p-3 bg-emerald-500 text-white text-xs font-bold rounded-2xl flex items-center gap-2 animate-scaleUp shrink-0">
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto pe-1 space-y-4">
          {/* ======================================================== */}
          {/* TAB 1: البيانات الشخصية الكاملة                           */}
          {/* ======================================================== */}
          {activeTab === 'profile' && (
            <div className="space-y-4 text-xs">
              {/* 1. اختيار صورة المستخدم من هاتفه أو من النماذج الجاهزة */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) {
                    processImageFile(e.dataTransfer.files[0]);
                  }
                }}
                className={`p-4 rounded-2xl border transition-all ${
                  isDragging
                    ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
                    : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800'
                } flex flex-col sm:flex-row items-center gap-4`}
              >
                {/* معاينة الصورة الحالية مع زر تغيير سريع */}
                <div className="relative shrink-0 group">
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-20 h-20 rounded-2xl object-cover ring-2 ring-amber-500 shadow-md transition-transform group-hover:scale-105"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1.5 -end-1.5 p-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-md transition-all active:scale-90 border-2 border-white dark:border-slate-900"
                    title={isAr ? 'اختر صورة من هاتفك' : 'Upload from device'}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                {/* خيارات رفع الصورة من الهاتف والاختيار من النماذج */}
                <div className="flex-1 text-center sm:text-start space-y-2.5 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm">
                        {isAr ? 'صورة الحساب الشخصي' : 'Profile Picture'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isAr
                          ? 'يمكنك رفع صورتك مباشرة من ألبوم الهاتف أو الكاميرا أو السحب والإفلات'
                          : 'Upload directly from phone camera/gallery or choose an avatar'}
                      </span>
                    </div>

                    {/* زر الرفع من الهاتف */}
                    <div className="flex items-center justify-center sm:justify-end gap-1.5">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            processImageFile(e.target.files[0]);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all active:scale-95 shadow-xs"
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                        <span>{isAr ? 'اختيار صورة من هاتفك' : 'Choose from Phone'}</span>
                      </button>

                      {avatarUrl && !AVATAR_PRESETS.includes(avatarUrl) && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl(AVATAR_PRESETS[0])}
                          className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 text-xs transition-all"
                          title={isAr ? 'الرجوع للصورة الافتراضية' : 'Revert to preset'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {uploadError && (
                    <div className="text-[11px] text-rose-500 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {/* صور رمزية سريعة بديلة */}
                  <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="text-[10px] text-slate-400 font-medium me-1">
                      {isAr ? 'أو اختر نموذجاً جاهزاً:' : 'Or choose preset:'}
                    </span>
                    {AVATAR_PRESETS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(url)}
                        className={`w-8 h-8 rounded-xl overflow-hidden border-2 transition-all ${
                          avatarUrl === url
                            ? 'border-amber-500 scale-105 shadow-xs ring-1 ring-amber-500'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt={`preset-${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* الاسم والبريد والهاتف */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {isAr ? 'الاسم بالكامل' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {isAr ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {isAr ? 'رقم الهاتف' : 'Phone'}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {isAr ? 'المهنة / التخصص' : 'Occupation'}
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              {/* الدولة والمدينة والجنس */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {isAr ? 'الدولة' : 'Country'}
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {isAr ? 'المدينة (للطقس والمواقيت)' : 'City'}
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {isAr ? 'الجنس' : 'Gender'}
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="male">{isAr ? 'ذكر 👨' : 'Male'}</option>
                    <option value="female">{isAr ? 'أنثى 👩' : 'Female'}</option>
                  </select>
                </div>
              </div>

              {/* ربط المعلومات: تاريخ الميلاد وحساب البرج والعمر تلقائياً وبدقة */}
              <div className="p-4 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-amber-500/10 dark:from-purple-950/40 dark:via-indigo-950/20 dark:to-amber-950/30 rounded-2xl border border-purple-200/80 dark:border-purple-800/80 space-y-3 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-purple-500 text-white shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block text-sm">
                        {isAr ? 'ربط تاريخ الميلاد وحساب البرج والعمر تلقائياً' : 'Automated Birthdate, Zodiac & Age'}
                      </span>
                      <span className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">
                        {isAr
                          ? 'بمجرد اختيار تاريخ ميلادك، يتم احتساب البرج الفلكي والعمر بدقة وتزامنها مع شريط الأخبار'
                          : 'Auto-calculates zodiac, exact age, and synchronizes with ticker'}
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700">
                    <CheckCircle2 className="w-3 h-3 text-purple-600 dark:text-purple-300" />
                    {isAr ? 'حساب آلي فوري' : 'Live Auto-Sync'}
                  </span>
                </div>

                {/* حقل اختيار تاريخ الميلاد */}
                <div>
                  <label className="block text-xs font-bold text-purple-950 dark:text-purple-200 mb-1.5 flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>{isAr ? 'تاريخ ميلادك (اليوم / الشهر / السنة):' : 'Your Date of Birth:'}</span>
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setBirthDate(newDate);
                      const z = getUserZodiac(newDate);
                      setZodiacSign(z.nameAr);
                    }}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-purple-300 dark:border-purple-700 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-xs"
                  />
                </div>

                {/* البطاقتان المحسوبتان تلقائياً من تاريخ الميلاد */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* بطاقة البرج الفلكي المحسوب تلقائياً */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-800 shadow-xs flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-2xl shrink-0 shadow-xs">
                      {calculatedZodiac.symbol}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                          {isAr ? 'البرج الفلكي المحسوب' : 'Calculated Zodiac'}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold">
                          {calculatedZodiac.elementAr}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">
                        {isAr ? calculatedZodiac.nameAr : calculatedZodiac.nameEn}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {calculatedZodiac.datesAr}
                      </p>
                      <p className="text-[10px] text-purple-700 dark:text-purple-300 mt-1 italic line-clamp-2">
                        💡 {getZodiacDailyTip(calculatedZodiac.nameAr, isAr)}
                      </p>
                    </div>
                  </div>

                  {/* بطاقة العمر الدقيق المحسوب تلقائياً */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-800 shadow-xs flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0 shadow-xs">
                      🎂
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                          {isAr ? 'العمر الدقيق' : 'Exact Age'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {isAr ? `${calculatedAge.hijriYears} سنة هجرية` : `${calculatedAge.hijriYears} Hijri Yrs`}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">
                        {isAr ? calculatedAge.textAr : calculatedAge.textEn}
                      </h4>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
                        {isAr
                          ? `تفصيلاً: ${calculatedAge.years} سنة و ${calculatedAge.months} شهر و ${calculatedAge.days} يوم`
                          : `Breakdown: ${calculatedAge.years}y ${calculatedAge.months}m ${calculatedAge.days}d`}
                      </p>
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <span>🎉</span>
                        <span>
                          {daysUntilBirthday === 0
                            ? (isAr ? 'اليوم يوم ميلادك السعيد! كل عام وأنت بخير!' : "Today is your birthday! Happy Birthday!")
                            : (isAr ? `متبقي ${daysUntilBirthday} يوماً على عيد ميلادك القادم` : `${daysUntilBirthday} days left until next birthday`)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: تخصيص شريط الأخبار والأسعار (المطلوب في الطلب)     */}
          {/* ======================================================== */}
          {activeTab === 'ticker' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-900 dark:text-amber-200">
                <span className="font-bold block mb-0.5">
                  {isAr ? '🎯 تخصيص عناصر شريط الأخبار المباشرة' : 'Live Ticker Elements Customization'}
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  {isAr
                    ? 'حدد بدقة ما يظهر في شريط الأخبار العلوي، وسرعة الحركة المناسبة لك، واختر فريقك المفضل في الدوري المصري، عيار الفضة، وعيار الذهب.'
                    : 'Choose which items appear on your header ticker, select scroll speed, favorite Egyptian team, silver karat, and gold karat.'}
                </p>
              </div>

              {/* اختيار سرعة حركة شريط الأخبار */}
              <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">⏱️</span>
                  <div>
                    <span className="font-bold block text-slate-900 dark:text-white">
                      {isAr ? 'سرعة حركة شريط الأخبار' : 'Ticker Scroll Speed'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isAr ? 'تحكم في سرعة تحرك الأخبار والأسعار لتناسب قراءتك المريحة' : 'Control ticker scrolling speed for comfortable reading'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                  {[
                    { id: 'very_slow', labelAr: 'هادئ جداً', labelEn: 'Very Slow' },
                    { id: 'slow', labelAr: 'مريح / بطيء', labelEn: 'Slow' },
                    { id: 'medium', labelAr: 'متوسط', labelEn: 'Medium' },
                    { id: 'fast', labelAr: 'سريع', labelEn: 'Fast' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setTickerPrefs({ ...tickerPrefs, speed: s.id as any })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        (tickerPrefs.speed || 'slow') === s.id
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isAr ? s.labelAr : s.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* بطاقات الخيارات التفاعلية */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. سعر الفضة */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🥈</span>
                      <div>
                        <span className="font-bold block text-slate-900 dark:text-white">
                          {isAr ? 'سعر الفضة (Silver)' : 'Silver Price'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isAr ? 'عرض أسعار الفضة اليومية' : 'Live silver quotes'}
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={tickerPrefs.showSilver}
                      onChange={(e) =>
                        setTickerPrefs({ ...tickerPrefs, showSilver: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-emerald-600 cursor-pointer accent-emerald-500"
                    />
                  </div>

                  {tickerPrefs.showSilver && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500">{isAr ? 'العيار:' : 'Karat:'}</span>
                      <select
                        value={tickerPrefs.silverUnit || '999'}
                        onChange={(e) =>
                          setTickerPrefs({
                            ...tickerPrefs,
                            silverUnit: e.target.value as '999' | '925' | 'ounce',
                          })
                        }
                        className="flex-1 p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-[11px]"
                      >
                        <option value="999">{isAr ? 'فضة نقية عيار 999 (54.20 ج.م)' : 'Fine 999'}</option>
                        <option value="925">{isAr ? 'فضة إسترليني عيار 925 (49.80 ج.م)' : 'Sterling 925'}</option>
                        <option value="ounce">{isAr ? 'أونصة الفضة عالمياً ($32.45)' : 'Ounce (USD)'}</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* 2. سعر الذهب - توسيع دائرة الاختيار لتشمل جميع العيارات والسبائك */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 flex flex-col justify-between gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🥇</span>
                      <div>
                        <span className="font-bold block text-slate-900 dark:text-white">
                          {isAr ? 'أسعار الذهب (Gold Market)' : 'Gold Market'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isAr ? 'جميع العيارات الرسمية والجنيه والسبائك' : 'All karats, coins & bullion'}
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={tickerPrefs.showGold}
                      onChange={(e) =>
                        setTickerPrefs({ ...tickerPrefs, showGold: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-amber-600 cursor-pointer accent-amber-500"
                    />
                  </div>

                  {tickerPrefs.showGold && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 shrink-0">
                          {isAr ? 'العيار المعتمد:' : 'Selected Unit:'}
                        </span>
                        <select
                          value={tickerPrefs.goldUnit || '24'}
                          onChange={(e) =>
                            setTickerPrefs({
                              ...tickerPrefs,
                              goldUnit: e.target.value as any,
                            })
                          }
                          className="flex-1 p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-[11px] text-slate-900 dark:text-white"
                        >
                          <option value="all">{isAr ? '🌟 عرض كافة العيارات والجنيه (بالتناوب)' : '🌟 All Karats & Pound (Rotating)'}</option>
                          {MOCK_GOLD_KARAT_RATES.map((g) => (
                            <option key={g.id} value={g.id}>
                              {isAr
                                ? `${g.nameAr} (${g.priceEgp ? `${g.priceEgp.toLocaleString()} ج.م` : `$${g.priceUsd}`})`
                                : `${g.nameEn} (${g.priceEgp ? `${g.priceEgp.toLocaleString()} EGP` : `$${g.priceUsd}`})`}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* شارة توضيحية للعيار المختار */}
                      {tickerPrefs.goldUnit !== 'all' && (
                        <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-[10px]">
                          {(() => {
                            const found = MOCK_GOLD_KARAT_RATES.find((g) => g.id === (tickerPrefs.goldUnit || '24'));
                            if (!found) return null;
                            return (
                              <>
                                <span className="font-bold text-amber-900 dark:text-amber-200 truncate">
                                  {isAr ? found.nameAr : found.nameEn}
                                </span>
                                <span className="font-mono font-extrabold text-amber-700 dark:text-amber-300">
                                  {found.priceEgp ? `${found.priceEgp.toLocaleString()} ج.م` : `$${found.priceUsd}`}
                                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 ms-1 font-sans">
                                    (+{found.change24h} ج.م)
                                  </span>
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. فريقك المفضل (أندية عالمية ومحلية) */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold block text-slate-900 dark:text-white">
                          {isAr ? 'فريقك المفضل (أندية عالمية ومحلية)' : 'Favorite Club (Global & Local)'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isAr ? 'متابعة نتائج وأهداف ناديك المفضل في شريط الأخبار' : 'Track your favorite club live scores'}
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={tickerPrefs.showEgyptianLeague}
                      onChange={(e) =>
                        setTickerPrefs({ ...tickerPrefs, showEgyptianLeague: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-emerald-600 cursor-pointer accent-emerald-500"
                    />
                  </div>

                  {tickerPrefs.showEgyptianLeague && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 shrink-0">
                          {isAr ? 'فريقك المفضل:' : 'Favorite Team:'}
                        </span>
                        <select
                          value={
                            isCustomTeamOpen
                              ? '__custom__'
                              : tickerPrefs.favoriteTeam || tickerPrefs.favoriteEgyptianTeam || 'الأهلي'
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__custom__') {
                              setIsCustomTeamOpen(true);
                            } else {
                              setIsCustomTeamOpen(false);
                              setTickerPrefs({
                                ...tickerPrefs,
                                favoriteTeam: val,
                                favoriteEgyptianTeam: val,
                              });
                            }
                          }}
                          className="flex-1 p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-[11px] text-slate-800 dark:text-slate-100"
                        >
                          {POPULAR_TEAMS_CATEGORIES.map((cat) => (
                            <optgroup
                              key={cat.titleAr}
                              label={`${cat.icon} ${isAr ? cat.titleAr : cat.titleEn}`}
                            >
                              {cat.teams.map((team) => (
                                <option key={team} value={team}>
                                  {team}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                          <option value="__custom__">
                            ➕ {isAr ? 'كتابة اسم فريق آخر...' : 'Enter custom club name...'}
                          </option>
                        </select>
                      </div>

                      {/* حقل مخصص لكتابة اسم أي فريق في العالم */}
                      {isCustomTeamOpen && (
                        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/60 shadow-xs">
                          <input
                            type="text"
                            value={customTeamInput}
                            onChange={(e) => setCustomTeamInput(e.target.value)}
                            placeholder={isAr ? 'اكتب اسم أي نادٍ (مثال: روما، أياكس، النجم الساحلي...)' : 'Type any club name...'}
                            className="flex-1 bg-transparent px-2 py-1 text-xs font-bold outline-none text-slate-800 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!customTeamInput.trim()) return;
                              const team = customTeamInput.trim();
                              setTickerPrefs({
                                ...tickerPrefs,
                                favoriteTeam: team,
                                favoriteEgyptianTeam: team,
                              });
                              setIsCustomTeamOpen(false);
                              showToast(isAr ? `تم اختيار ${team} كفريقك المفضل!` : `Selected ${team} as favorite!`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all"
                          >
                            {isAr ? 'تأكيد' : 'Set'}
                          </button>
                        </div>
                      )}

                      {/* إشعار بالفريق المختار حالياً */}
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg flex items-center justify-between">
                        <span>
                          {isAr ? 'الفريق المعتمد حالياً:' : 'Current Club:'}{' '}
                          <span className="font-extrabold underline decoration-emerald-500">
                            {tickerPrefs.favoriteTeam || tickerPrefs.favoriteEgyptianTeam || 'الأهلي'}
                          </span>
                        </span>
                        <span className="text-[9px] opacity-75">⚽ نتائج حية في الشريط</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. برج المستخدم اليومي */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    <div>
                      <span className="font-bold block text-slate-900 dark:text-white">
                        {isAr ? 'برج المستخدم ورسالة اليوم' : 'User Zodiac & Tip'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isAr ? `البرج: ${zodiacSign}` : `Sign: ${zodiacSign}`}
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={tickerPrefs.showZodiac}
                    onChange={(e) =>
                      setTickerPrefs({ ...tickerPrefs, showZodiac: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-purple-600 cursor-pointer accent-purple-500"
                  />
                </div>

                {/* 5. الوقت والتاريخ */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⏰</span>
                    <div>
                      <span className="font-bold block text-slate-900 dark:text-white">
                        {isAr ? 'الوقت والتقويم الهجري/الميلادي' : 'Time & Dates'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isAr ? 'الساعة والتقويم اللحظي' : 'Clock & Hijri'}
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={tickerPrefs.showTimeAndDate}
                    onChange={(e) =>
                      setTickerPrefs({ ...tickerPrefs, showTimeAndDate: e.target.checked })
                    }
                    className="w-4 h-4 rounded cursor-pointer accent-amber-500"
                  />
                </div>

                {/* 6. العملات النقدية */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💵</span>
                    <div>
                      <span className="font-bold block text-slate-900 dark:text-white">
                        {isAr ? 'العملات النقدية (USD, SAR, AED)' : 'Fiat Currencies'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isAr ? 'أسعار الصرف الرسمية' : 'Exchange rates'}
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={tickerPrefs.showCurrencies}
                    onChange={(e) =>
                      setTickerPrefs({ ...tickerPrefs, showCurrencies: e.target.checked })
                    }
                    className="w-4 h-4 rounded cursor-pointer accent-emerald-500"
                  />
                </div>

                {/* 7. العملات المشفرة (Cryptocurrency) - بحث وإضافة عبر الإنترنت واختيار من القائمة */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 flex flex-col justify-between gap-3 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-xs">
                        <Bitcoin className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold block text-slate-900 dark:text-white text-sm">
                          {isAr ? 'العملات المشفرة الرقمية (Crypto)' : 'Cryptocurrencies (Crypto)'}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isAr
                            ? 'ابحث عن أي عملة مشفرة عبر الإنترنت وأضفها لشريط الأخبار اللحظي'
                            : 'Search and add any cryptocurrency online directly to live ticker'}
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={tickerPrefs.showCrypto}
                      onChange={(e) =>
                        setTickerPrefs({ ...tickerPrefs, showCrypto: e.target.checked })
                      }
                      className="w-4 h-4 rounded cursor-pointer accent-amber-500"
                    />
                  </div>

                  {tickerPrefs.showCrypto && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3">
                      {/* محرك البحث عن العملات عبر الإنترنت وقائمة منسدلة سريعة */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 start-0 flex items-center ps-2.5 pointer-events-none text-slate-400">
                              {isSearchingCryptoOnline ? (
                                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                              ) : (
                                <Search className="w-4 h-4" />
                              )}
                            </div>
                            <input
                              type="text"
                              value={cryptoSearchQuery}
                              onChange={(e) => handleSearchCrypto(e.target.value)}
                              onFocus={() => {
                                if (!cryptoSearchQuery) {
                                  setCryptoSearchResults(EXTENDED_CRYPTO_DATABASE.slice(0, 8));
                                }
                                setIsCryptoDropdownOpen(true);
                              }}
                              placeholder={
                                isAr
                                  ? 'ابحث بالاسم أو الرمز (مثال: SOL, PEPE, SUI, DOGE, NEAR, RENDER...)'
                                  : 'Search crypto by symbol/name (e.g. SOL, PEPE, SUI...)'
                              }
                              className="w-full ps-8 pe-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                            />
                            {cryptoSearchQuery && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCryptoSearchQuery('');
                                  setCryptoSearchResults([]);
                                }}
                                className="absolute inset-y-0 end-0 flex items-center pe-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSearchCrypto(cryptoSearchQuery || 'SOL')}
                            disabled={isSearchingCryptoOnline}
                            className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                          >
                            <Globe2 className="w-3.5 h-3.5" />
                            <span>{isAr ? 'بحث عبر النت' : 'Search Web'}</span>
                          </button>
                        </div>

                        {/* قائمة اختيار سريعة منسدلة (Quick Select Dropdown) */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 shrink-0">
                            {isAr ? 'أو اختر من القائمة:' : 'Or pick from list:'}
                          </span>
                          <select
                            value=""
                            onChange={(e) => {
                              const sym = e.target.value;
                              if (!sym) return;
                              const coin =
                                EXTENDED_CRYPTO_DATABASE.find((c) => c.symbol === sym) ||
                                (tickerPrefs.customCryptos || []).find((c) => c.symbol === sym);
                              if (coin) handleAddCrypto(coin);
                            }}
                            className="flex-1 p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-[11px] text-slate-800 dark:text-slate-100"
                          >
                            <option value="">
                              {isAr ? '-- اختر عملة مشفرة لإضافتها مباشرة --' : '-- Choose a crypto to add --'}
                            </option>
                            {EXTENDED_CRYPTO_DATABASE.map((c) => (
                              <option key={c.id} value={c.symbol}>
                                {c.symbol} - {c.nameAr || c.name} (${c.priceUsd.toLocaleString()})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* نتائج البحث المباشرة عبر الإنترنت في بطاقة منسدلة */}
                        {cryptoSearchResults.length > 0 && (
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-400/50 dark:border-amber-500/30 shadow-lg space-y-1.5 max-h-56 overflow-y-auto">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800 text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                              <span>
                                {isAr
                                  ? `نتائج البحث عن "${cryptoSearchQuery}" (${cryptoSearchResults.length} عملة):`
                                  : `Results for "${cryptoSearchQuery}":`}
                              </span>
                              <button
                                type="button"
                                onClick={() => setCryptoSearchResults([])}
                                className="text-slate-400 hover:text-slate-600 text-[9px]"
                              >
                                {isAr ? 'إغلاق' : 'Close'}
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {cryptoSearchResults.map((coin) => {
                                const isSelected = (tickerPrefs.selectedCryptos || []).includes(coin.symbol);
                                return (
                                  <div
                                    key={coin.id}
                                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="text-base shrink-0">{coin.iconSymbol || '🪙'}</span>
                                      <div className="leading-tight truncate">
                                        <div className="flex items-center gap-1">
                                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                                            {coin.symbol}
                                          </span>
                                          <span className="text-[10px] text-slate-400 truncate">
                                            {coin.nameAr || coin.name}
                                          </span>
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300">
                                          ${coin.priceUsd.toLocaleString()}
                                          <span
                                            className={`ms-1 text-[9px] font-bold ${
                                              coin.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                            }`}
                                          >
                                            {coin.change24h >= 0 ? `+${coin.change24h}%` : `${coin.change24h}%`}
                                          </span>
                                        </span>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isSelected) {
                                          handleRemoveCrypto(coin.symbol);
                                        } else {
                                          handleAddCrypto(coin);
                                        }
                                      }}
                                      className={`px-2 py-1 rounded-md text-[10px] font-extrabold transition-all shrink-0 ${
                                        isSelected
                                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/50'
                                          : 'bg-amber-500 text-slate-950 hover:bg-amber-600'
                                      }`}
                                    >
                                      {isSelected ? (isAr ? '✓ مضافة' : '✓ Added') : (isAr ? '+ إضافة' : '+ Add')}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* العملات المحددة حالياً في شريط الأخبار مع إمكانية حذف أي منها */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between flex-wrap gap-2 text-[10px]">
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <span>🪙</span>
                            <span>
                              {isAr
                                ? `العملات المعروضة في شريط الأخبار (${(tickerPrefs.selectedCryptos || ['BTC', 'ETH', 'SOL']).length}):`
                                : `Active Coins (${(tickerPrefs.selectedCryptos || ['BTC', 'ETH', 'SOL']).length}):`}
                            </span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setTickerPrefs({
                                  ...tickerPrefs,
                                  selectedCryptos: [
                                    ...MOCK_CRYPTO_RATES.map((c) => c.symbol),
                                    ...(tickerPrefs.customCryptos || []).map((c) => c.symbol),
                                  ],
                                })
                              }
                              className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold hover:bg-amber-500/25 transition-all"
                            >
                              {isAr ? 'تحديد الكل' : 'Select All'}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setTickerPrefs({
                                  ...tickerPrefs,
                                  selectedCryptos: ['BTC', 'ETH', 'SOL'],
                                })
                              }
                              className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 transition-all"
                            >
                              {isAr ? 'الأساسية (BTC, ETH, SOL)' : 'Top 3'}
                            </button>
                          </div>
                        </div>

                        {/* شارات العملات المحددة مع زر الحذف ✕ */}
                        <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          {(tickerPrefs.selectedCryptos || ['BTC', 'ETH', 'SOL']).map((sym) => {
                            const coin =
                              EXTENDED_CRYPTO_DATABASE.find((c) => c.symbol === sym) ||
                              (tickerPrefs.customCryptos || []).find((c) => c.symbol === sym);
                            return (
                              <div
                                key={sym}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 border border-amber-400/40 text-slate-800 dark:text-white text-xs font-bold shadow-xs animate-fadeIn"
                              >
                                <span>{coin?.iconSymbol || '🪙'}</span>
                                <span className="font-extrabold">{sym}</span>
                                {coin && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    ${coin.priceUsd.toLocaleString()}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCrypto(sym)}
                                  className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-rose-500 hover:text-white flex items-center justify-center text-[10px] transition-colors"
                                  title={isAr ? `إزالة ${sym}` : `Remove ${sym}`}
                                >
                                  ✕
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* شبكة العملات المشفرة الأكثر شيوعاً للاختيار السريع */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 block">
                          {isAr ? 'نقر سريع لتفعيل/تعطيل العملات الشهيرة:' : 'Quick toggle popular coins:'}
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                          {MOCK_CRYPTO_RATES.map((coin) => {
                            const currentSelected = tickerPrefs.selectedCryptos || ['BTC', 'ETH', 'SOL'];
                            const isSelected = currentSelected.includes(coin.symbol);
                            return (
                              <button
                                key={coin.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    handleRemoveCrypto(coin.symbol);
                                  } else {
                                    handleAddCrypto(coin);
                                  }
                                }}
                                className={`p-2 rounded-xl border flex items-center justify-between text-start transition-all active:scale-95 ${
                                  isSelected
                                    ? 'bg-amber-500/15 dark:bg-amber-500/20 border-amber-500 text-slate-900 dark:text-white shadow-xs'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 opacity-60 hover:opacity-90'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-sm shrink-0">{coin.iconSymbol || '🪙'}</span>
                                  <div className="leading-tight truncate">
                                    <span className="font-extrabold text-[11px] block truncate">
                                      {coin.symbol}
                                    </span>
                                    <span className="text-[9px] text-slate-400 block truncate">
                                      ${coin.priceUsd.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                                <span
                                  className={`text-[9px] font-bold shrink-0 ${
                                    coin.change24h >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                                  }`}
                                >
                                  {coin.change24h >= 0 ? `+${coin.change24h}%` : `${coin.change24h}%`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 8. حالة الطقس */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌤️</span>
                    <div>
                      <span className="font-bold block text-slate-900 dark:text-white">
                        {isAr ? 'حالة الطقس ودرجة الحرارة' : 'Weather'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isAr ? `مدينة ${city}` : `City: ${city}`}
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={tickerPrefs.showWeather}
                    onChange={(e) =>
                      setTickerPrefs({ ...tickerPrefs, showWeather: e.target.checked })
                    }
                    className="w-4 h-4 rounded cursor-pointer accent-sky-500"
                  />
                </div>
              </div>

              {/* 9. رسالة مخصصة للمستخدم على الشريط */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📢</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {isAr ? 'شريط العبارة المخصصة / الحكمة اليومية' : 'Custom Motivational Banner'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={tickerPrefs.showCustomMessage}
                    onChange={(e) =>
                      setTickerPrefs({ ...tickerPrefs, showCustomMessage: e.target.checked })
                    }
                    className="w-4 h-4 rounded cursor-pointer accent-amber-500"
                  />
                </div>

                {tickerPrefs.showCustomMessage && (
                  <input
                    type="text"
                    value={tickerPrefs.customMessage || ''}
                    onChange={(e) =>
                      setTickerPrefs({ ...tickerPrefs, customMessage: e.target.value })
                    }
                    placeholder={isAr ? 'اكتب عبارتك لتظهر على شريط الأخبار...' : 'Type your banner phrase...'}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-amber-700 dark:text-amber-400"
                  />
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: تفضيلات الأقسام كلها (المطلوب في الطلب)            */}
          {/* ======================================================== */}
          {activeTab === 'sections' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-900 dark:text-indigo-200">
                <span className="font-bold block mb-0.5">
                  {isAr ? '🗂️ ضبط وتفضيلات أقسام التطبيق' : 'All Modules Preferences'}
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  {isAr
                    ? 'املأ الحقول لتخصيص سلوك كل قسم: السيارات، المصاريف، المطبخ، العبادات، والتعليم.'
                    : 'Configure defaults for vehicles, expenses, cooking, prayers, and student tracking.'}
                </p>
              </div>

              {/* 1. قسم السيارات والمركبات */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                  <Car className="w-4 h-4" />
                  <span>{isAr ? 'قسم السيارات والمركبات' : 'Vehicles Module'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {isAr ? 'سيارتك الأساسية' : 'Primary Car'}
                    </label>
                    <input
                      type="text"
                      value={vehiclePrefs.primaryVehicleName || ''}
                      onChange={(e) =>
                        setVehiclePrefs({ ...vehiclePrefs, primaryVehicleName: e.target.value })
                      }
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {isAr ? 'نوع الوقود المفضل' : 'Fuel Type'}
                    </label>
                    <select
                      value={vehiclePrefs.fuelType || 'gasoline95'}
                      onChange={(e) =>
                        setVehiclePrefs({
                          ...vehiclePrefs,
                          fuelType: e.target.value as any,
                        })
                      }
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    >
                      <option value="gasoline95">{isAr ? 'بنزين 95' : 'Gasoline 95'}</option>
                      <option value="gasoline92">{isAr ? 'بنزين 92' : 'Gasoline 92'}</option>
                      <option value="gas">{isAr ? 'غاز طبيعي' : 'Natural Gas'}</option>
                      <option value="diesel">{isAr ? 'سولار / ديزل' : 'Diesel'}</option>
                      <option value="electric">{isAr ? 'كهرباء' : 'Electric'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {isAr ? 'تنبيه صيانة كل (كم)' : 'Service Every (Km)'}
                    </label>
                    <input
                      type="number"
                      value={vehiclePrefs.serviceIntervalKm || 10000}
                      onChange={(e) =>
                        setVehiclePrefs({
                          ...vehiclePrefs,
                          serviceIntervalKm: Number(e.target.value),
                        })
                      }
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 2. قسم المصاريف والميزانية */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                  <DollarSign className="w-4 h-4" />
                  <span>{isAr ? 'قسم المصاريف والميزانية' : 'Expenses & Budget'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {isAr ? 'الميزانية الشهرية المقدرة' : 'Monthly Budget'}
                    </label>
                    <input
                      type="number"
                      value={budgetPrefs.monthlyBudgetLimit || 25000}
                      onChange={(e) =>
                        setBudgetPrefs({
                          ...budgetPrefs,
                          monthlyBudgetLimit: Number(e.target.value),
                        })
                      }
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {isAr ? 'العملة الأساسية' : 'Currency'}
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as CurrencyType)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    >
                      <option value="EGP">جنيه مصري (EGP)</option>
                      <option value="SAR">ريال سعودي (SAR)</option>
                      <option value="AED">درهم إماراتي (AED)</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                      <option value="EUR">يورو (EUR)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {isAr ? 'طريقة الدفع الافتراضية' : 'Default Payment'}
                    </label>
                    <select
                      value={budgetPrefs.defaultPaymentMethod || 'instapay'}
                      onChange={(e) =>
                        setBudgetPrefs({
                          ...budgetPrefs,
                          defaultPaymentMethod: e.target.value as any,
                        })
                      }
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="instapay">{isAr ? 'إنستاباي (InstaPay)' : 'InstaPay'}</option>
                      <option value="cash">{isAr ? 'نقدي (كاش)' : 'Cash'}</option>
                      <option value="vodafoneCash">{isAr ? 'محفظة إلكترونية (كاش)' : 'E-Wallet'}</option>
                      <option value="card">{isAr ? 'بطاقة بنكية (فيزا)' : 'Bank Card'}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. قسم العبادات والدين */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold">
                  <Clock className="w-4 h-4" />
                  <span>{isAr ? 'قسم العبادات والروحانيات' : 'Religious & Faith'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {isAr ? 'القسم الديني' : 'Preference'}
                    </label>
                    <select
                      value={relPref}
                      onChange={(e) => setRelPref(e.target.value as ReligiousPreference)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="islam">إسلامي (قرآن، أذكار، صلاة)</option>
                      <option value="christianity">مسيحي (إنجيل، صلوات، تأملات)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {isAr ? 'القارئ المفضل' : 'Preferred Reciter'}
                    </label>
                    <input
                      type="text"
                      value={relDetails.reciter || ''}
                      onChange={(e) =>
                        setRelDetails({ ...relDetails, reciter: e.target.value })
                      }
                      placeholder="الشيخ الحصري، المنشاوي، عبد الباسط..."
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* 4. قسم المطبخ والتغذية */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold">
                  <Utensils className="w-4 h-4" />
                  <span>{isAr ? 'قسم المطبخ والوجبات' : 'Food & Kitchen'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {isAr ? 'النظام الغذائي' : 'Diet Plan'}
                    </label>
                    <select
                      value={foodPrefs.dietType || 'balanced'}
                      onChange={(e) =>
                        setFoodPrefs({ ...foodPrefs, dietType: e.target.value as any })
                      }
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="balanced">{isAr ? 'متوازن وصحي' : 'Balanced'}</option>
                      <option value="keto">{isAr ? 'حمية كيتو' : 'Keto'}</option>
                      <option value="vegetarian">{isAr ? 'نباتي' : 'Vegetarian'}</option>
                      <option value="lowCalorie">{isAr ? 'قليل السعرات' : 'Low Calorie'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {isAr ? 'وجبتك المفضلة' : 'Favorite Dish'}
                    </label>
                    <input
                      type="text"
                      value={foodPrefs.favoriteDish || ''}
                      onChange={(e) =>
                        setFoodPrefs({ ...foodPrefs, favoriteDish: e.target.value })
                      }
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* 5. قسم التعليم والطلاب */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold">
                  <BookOpen className="w-4 h-4" />
                  <span>{isAr ? 'قسم التعليم والأبناء' : 'Education & Kids'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {isAr ? 'المرحلة الدراسية الافتراضية' : 'Grade Level'}
                    </label>
                    <input
                      type="text"
                      value={eduPrefs.defaultGradeLevel || ''}
                      onChange={(e) =>
                        setEduPrefs({ ...eduPrefs, defaultGradeLevel: e.target.value })
                      }
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {isAr ? 'رمز PIN للخزنة' : 'Vault PIN Code'}
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center tracking-widest font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: المظهر واللغة                                     */}
          {/* ======================================================== */}
          {activeTab === 'preferences' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-2">{isAr ? 'لغة التطبيق' : 'Language'}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ar', 'en', 'fr'] as Language[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => onLanguageChange(l)}
                      className={`p-3 rounded-2xl border text-center font-bold transition-all ${
                        language === l
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {l === 'ar' ? 'العربية 🇸🇦' : l === 'en' ? 'English 🇺🇸' : 'Français 🇫🇷'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold mb-2">{isAr ? 'وضع المظهر' : 'Theme Mode'}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onThemeChange('light')}
                    className={`p-3 rounded-2xl border text-center font-bold transition-all ${
                      theme === 'light'
                        ? 'border-amber-500 bg-amber-50 text-amber-600 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    ☀️ {isAr ? 'فاتح (Light)' : 'Light'}
                  </button>
                  <button
                    onClick={() => onThemeChange('dark')}
                    className={`p-3 rounded-2xl border text-center font-bold transition-all ${
                      theme === 'dark'
                        ? 'border-amber-500 bg-amber-950/40 text-amber-400 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    🌙 {isAr ? 'داكن (Dark)' : 'Dark'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: النسخ والبيانات                                   */}
          {/* ======================================================== */}
          {activeTab === 'backup' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white">
                  {isAr ? 'تصدير نسخة احتياطية كاملة' : 'Export Full Backup'}
                </h4>
                <p className="text-slate-500 leading-relaxed">
                  {isAr
                    ? 'قم بتنزيل ملف JSON يحتوي على كافة الملاحظات، الحسابات، جداول الأبناء، سجلات السيارات، والوصفات.'
                    : 'Download a standalone JSON backup file containing all notes, expenses, vehicles and student records.'}
                </p>
                <button
                  onClick={handleExportBackup}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-all shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>{isAr ? 'تصدير النسخة (Export JSON)' : 'Export JSON'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white">
                  {isAr ? 'استعادة من ملف احتياطي' : 'Restore from Backup'}
                </h4>
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer transition-all">
                  <Upload className="w-4 h-4" />
                  <span>{isAr ? 'اختيار ملف الاستعادة' : 'Choose Backup File'}</span>
                  <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">
                  {isAr ? 'استعادة بيانات المصنع الافتراضية:' : 'Reset Defaults:'}
                </span>
                <button
                  onClick={onDataReset}
                  className="flex items-center gap-1 text-rose-500 hover:underline font-bold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إعادة ضبط' : 'Reset All'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Action: حفظ جميع التعديلات وربطها فوراً */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>

          <button
            type="button"
            onClick={() => handleSaveAll()}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{isAr ? 'حفظ كافة التعديلات وربطها بشريط الأخبار' : 'Save & Sync to Ticker'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
