import React, { useState } from 'react';
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
import { calculateUserAge, getUserZodiac } from '../utils/liveInfoHelpers';

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

const EGYPTIAN_TEAMS = [
  'الأهلي',
  'الزمالك',
  'بيراميدز',
  'الإسماعيلي',
  'المصري',
  'الاتحاد السكندري',
  'سيراميكا كليوباترا',
  'زد إف سي',
  'مودرن سبورت',
  'سموحة',
  'غزل المحلة',
  'إنبي',
  'البنك الأهلي',
  'طلائع الجيش',
];

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
  const [zodiacSign, setZodiacSign] = useState(userProfile.zodiacSign || 'العذراء');
  const [currency, setCurrency] = useState<CurrencyType>(userProfile.currency || 'EGP');
  const [pin, setPin] = useState(userProfile.pin || '1234');
  const [relPref, setRelPref] = useState<ReligiousPreference>(userProfile.religiousPreference || 'islam');

  // حساب العمر والبرج التلقائي من التاريخ
  const calculatedAge = calculateUserAge(birthDate);
  const calculatedZodiac = getUserZodiac(birthDate);

  // 2. تفضيلات شريط الأخبار المباشرة
  const initialTicker = userProfile.tickerPreferences || {
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

  const [tickerPrefs, setTickerPrefs] = useState<TickerPreferences>(initialTicker);

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
      zodiacSign: zodiacSign || calculatedZodiac.nameAr,
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
              {/* صورة الأفاتار */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-500/80 shadow-md shrink-0"
                />
                <div className="flex-1 text-center sm:text-start space-y-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    {isAr ? 'اختر صورتك الشخصية (Avatar)' : 'Choose your avatar'}
                  </span>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    {AVATAR_PRESETS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(url)}
                        className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all ${
                          avatarUrl === url
                            ? 'border-amber-500 scale-105 shadow-xs'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt="preset" className="w-full h-full object-cover" />
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

              {/* تاريخ الميلاد + حساب البرج والعمر */}
              <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-bold text-purple-900 dark:text-purple-200">
                      {isAr ? 'تاريخ الميلاد وحساب البرج الفلكي' : 'Birthdate & Zodiac'}
                    </span>
                  </div>
                  <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold">
                    {isAr ? `العمر: ${calculatedAge.textAr}` : `Age: ${calculatedAge.textEn}`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-purple-800 dark:text-purple-300 mb-1">
                      {isAr ? 'اختر تاريخ ميلادك' : 'Birth Date'}
                    </label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => {
                        setBirthDate(e.target.value);
                        const z = getUserZodiac(e.target.value);
                        setZodiacSign(z.nameAr);
                      }}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-purple-800 dark:text-purple-300 mb-1">
                      {isAr ? 'البرج المعتمد لشريط الأخبار' : 'Zodiac Sign for Ticker'}
                    </label>
                    <select
                      value={zodiacSign}
                      onChange={(e) => setZodiacSign(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 font-bold"
                    >
                      {ZODIAC_LIST.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
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
                    ? 'حدد بدقة ما يظهر في شريط الأخبار العلوي، واختر فريقك المفضل في الدوري المصري، عيار الفضة، وعيار الذهب.'
                    : 'Choose which items appear on your header ticker, select your favorite Egyptian team, silver karat, and gold karat.'}
                </p>
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

                {/* 2. سعر الذهب */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🥇</span>
                      <div>
                        <span className="font-bold block text-slate-900 dark:text-white">
                          {isAr ? 'سعر الذهب (Gold)' : 'Gold Price'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isAr ? 'أسعار الذهب لحظة بلحظة' : 'Gold rates'}
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
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500">{isAr ? 'العيار:' : 'Karat:'}</span>
                      <select
                        value={tickerPrefs.goldUnit || '24'}
                        onChange={(e) =>
                          setTickerPrefs({
                            ...tickerPrefs,
                            goldUnit: e.target.value as '24' | '21',
                          })
                        }
                        className="flex-1 p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-[11px]"
                      >
                        <option value="24">{isAr ? 'عيار 24 (3908 ج.م)' : '24 Karat'}</option>
                        <option value="21">{isAr ? 'عيار 21 (3420 ج.م)' : '21 Karat'}</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* 3. نتائج الدوري المصري الممتاز */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⚽</span>
                      <div>
                        <span className="font-bold block text-slate-900 dark:text-white">
                          {isAr ? 'مباريات الدوري المصري' : 'Egyptian League'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isAr ? 'نتائج ومواعيد الدوري الممتاز' : 'Premier League results'}
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
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500">{isAr ? 'فريقك المفضّل:' : 'Favorite:'}</span>
                      <select
                        value={tickerPrefs.favoriteEgyptianTeam || 'الأهلي'}
                        onChange={(e) =>
                          setTickerPrefs({
                            ...tickerPrefs,
                            favoriteEgyptianTeam: e.target.value,
                          })
                        }
                        className="flex-1 p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-[11px]"
                      >
                        {EGYPTIAN_TEAMS.map((team) => (
                          <option key={team} value={team}>
                            {team}
                          </option>
                        ))}
                      </select>
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

                {/* 7. العملات الرقمية */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">₿</span>
                    <div>
                      <span className="font-bold block text-slate-900 dark:text-white">
                        {isAr ? 'العملات الرقمية (BTC, ETH)' : 'Crypto Rates'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isAr ? 'بيتكوين وإيثيريوم' : 'Bitcoin & Ethereum'}
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

              {/* 10. سرعة حركة شريط الأخبار */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⏱️</span>
                  <div>
                    <span className="font-bold block text-slate-900 dark:text-white">
                      {isAr ? 'سرعة حركة شريط الأخبار' : 'Ticker Scrolling Speed'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isAr
                        ? 'اختر السرعة التي تناسب راحتك في قراءة الأخبار والأسعار'
                        : 'Pick the pace that suits your reading comfort'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([
                    { value: 'verySlow', labelAr: 'هادئ جداً', labelEn: 'Very Calm' },
                    { value: 'slow', labelAr: 'مريح / بطيء', labelEn: 'Comfortable' },
                    { value: 'medium', labelAr: 'متوسط', labelEn: 'Medium' },
                    { value: 'fast', labelAr: 'سريع', labelEn: 'Fast' },
                  ] as const).map((opt) => {
                    const active = (tickerPrefs.tickerSpeed || 'slow') === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setTickerPrefs({ ...tickerPrefs, tickerSpeed: opt.value })
                        }
                        className={`p-2 rounded-xl border text-[11px] font-bold transition-colors ${
                          active
                            ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-400'
                        }`}
                      >
                        {isAr ? opt.labelAr : opt.labelEn}
                      </button>
                    );
                  })}
                </div>
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
