import React, { useState, useRef, useEffect } from 'react';
import {
  Home,
  Settings,
  Search,
  Mic,
  Moon,
  Sun,
  Bell,
  SlidersHorizontal,
  ArrowRight,
  ArrowLeft,
  MoreVertical,
  Clock,
  LogOut,
} from 'lucide-react';
import { Language, ThemeMode, UserProfile, AppNotification, DailyTask, Note } from '../types';
import { translations } from '../services/i18n';
import { LiveHeaderWidgets } from './LiveHeaderWidgets';
import { DhakirniReminderBar } from './DhakirniReminderBar';

interface NavigationHeaderProps {
  user: UserProfile;
  activeTab: string;
  onNavigate: (tab: string) => void;
  onBack?: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  isAndroidView?: boolean;
  onToggleAndroidView?: () => void;
  onOpenSearch: () => void;
  onOpenVoiceSearch: () => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  isSettingsOpen?: boolean;
  notifications: AppNotification[];
  dailyTasks?: DailyTask[];
  notes?: Note[];
  onToggleDailyTask?: (id: string) => void;
  onAddDailyTask?: (task: Omit<DailyTask, 'id' | 'createdAt'>) => void;
  onDeleteDailyTask?: (id: string) => void;
  onLogout?: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  user,
  activeTab,
  onNavigate,
  onBack,
  language,
  onLanguageChange,
  theme,
  onToggleTheme,
  onOpenSearch,
  onOpenVoiceSearch,
  onOpenNotifications,
  onOpenSettings,
  isSettingsOpen = false,
  notifications,
  dailyTasks = [],
  notes = [],
  onToggleDailyTask,
  onAddDailyTask,
  onDeleteDailyTask,
  onLogout,
}) => {
  const t = translations[language];
  const isAr = language === 'ar';
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const menuRef = useRef<HTMLDivElement>(null);

  // تحديث الساعة الثابتة كل ثانية
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeFormatted = now.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Close overflow menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      onNavigate('dashboard');
    }
  };

  const isHomeActive = activeTab === 'dashboard';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs select-none">
      {/* 1. Android Top App Bar / Toolbar */}
      <div className="px-2.5 sm:px-3 h-14 flex items-center justify-between gap-1.5">
        
        {/* Side A (Start): User Profile Photo & Name (+ Back button if inside a subscreen) */}
        <div className="flex items-center gap-1.5 min-w-0 shrink-0">
          {!isHomeActive && (
            <button
              onClick={handleBackClick}
              className="w-8 h-8 rounded-xl bg-accent-500/10 hover:bg-accent-500/20 text-accent-700 dark:text-accent-400 flex items-center justify-center font-bold transition-all active:scale-95 border border-accent-500/20 shrink-0"
              title={isAr ? 'رجوع للخلف' : 'Back'}
              id="android-back-btn"
            >
              {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 p-1 pe-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-start group active:scale-95 max-w-[145px] sm:max-w-[190px]"
            title={isAr ? 'الملف الشخصي والإعدادات' : 'User Profile & Settings'}
            id="android-profile-btn"
          >
            <div className="relative shrink-0">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-xl object-cover ring-2 ring-accent-500/80 shadow-xs"
              />
              <span className="absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
            </div>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user.name}
              </span>
              <span className="text-[10px] text-accent-600 dark:text-accent-400 font-semibold truncate">
                {user.occupation || (isAr ? 'الحساب الشخصي' : 'Personal')}
              </span>
            </div>
          </button>
        </div>

        {/* Center / Action Buttons (Fixed Clock, Settings Gear, Search, Mic, Notifications, Menu) */}
        <div className="flex items-center gap-1 shrink-0">
          {/* الساعة الثابتة فى الشريط العلوى (Fixed Live Clock) */}
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 shadow-2xs shrink-0 select-none"
            title={isAr ? 'الساعة الثابتة — الوقت الحالي' : 'Live Clock — Current Time'}
            id="android-fixed-clock"
          >
            <Clock className="w-3.5 h-3.5 text-accent-500 animate-pulse shrink-0" />
            <span className="font-mono font-black text-xs tracking-tight">
              {timeFormatted}
            </span>
          </div>

          {/* ترس السيتنج (Settings Gear) */}
          <button
            onClick={onOpenSettings}
            className="w-8.5 h-8.5 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
            title={isAr ? 'الإعدادات والنسخ الاحتياطي (Settings)' : 'Settings & Backup'}
            id="android-settings-gear-btn"
          >
            <Settings className="w-4 h-4 hover:rotate-45 transition-transform" />
          </button>

          {/* Search Button */}
          <button
            onClick={onOpenSearch}
            className="w-8.5 h-8.5 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-colors"
            title={isAr ? 'بحث سريع' : 'Search'}
            id="android-search-btn"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Voice Search Button */}
          <button
            onClick={onOpenVoiceSearch}
            className="w-8.5 h-8.5 rounded-xl flex items-center justify-center text-accent-600 dark:text-accent-400 hover:bg-accent-500/10 active:scale-95 transition-colors"
            title={isAr ? 'البحث الصوتي' : 'Voice Search'}
            id="android-mic-btn"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="relative w-8.5 h-8.5 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-colors"
            title={t.notifications}
            id="android-notifications-btn"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Android 3-Dots Overflow Menu (⋮) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-colors active:scale-95 ${
                isMenuOpen
                  ? 'bg-accent-500 text-slate-950'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isAr ? 'خيارات إضافية' : 'More Options'}
              id="android-overflow-menu-btn"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Android Dropdown Menu Sheet */}
            {isMenuOpen && (
              <div
                className="absolute end-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-1.5 z-50 animate-fadeIn"
                id="android-overflow-dropdown"
              >
                {/* Theme toggle */}
                <button
                  onClick={() => {
                    onToggleTheme();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-accent-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-slate-600" />
                    )}
                    <span>{isAr ? 'المظهر (داكن / فاتح)' : 'Theme Mode'}</span>
                  </span>
                  <span className="text-[10px] text-accent-600 font-bold uppercase">
                    {theme === 'dark' ? (isAr ? 'داكن' : 'Dark') : (isAr ? 'فاتح' : 'Light')}
                  </span>
                </button>

                {/* Language options */}
                <div className="py-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {isAr ? 'اللغة' : 'Language'}
                  </div>
                  {(['ar', 'en', 'fr'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        onLanguageChange(lang);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        language === lang
                          ? 'bg-accent-500/10 text-accent-600 dark:text-accent-400 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>
                        {lang === 'ar' ? 'العربية (RTL)' : lang === 'en' ? 'English (LTR)' : 'Français'}
                      </span>
                      {language === lang && <span className="text-accent-500 text-xs">✓</span>}
                    </button>
                  ))}
                </div>

                {/* Logout */}
                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => { if (window.confirm(isAr ? 'هل تريد تسجيل الخروج من SMART TIME؟' : 'Sign out of SMART TIME?')) { onLogout?.(); setIsMenuOpen(false); } }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{isAr ? 'تسجيل الخروج' : 'Sign out'}</span>
                  </button>
                </div>

                {/* Settings Link */}
                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      onOpenSettings();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-accent-500" />
                    <span>{t.backupAndSettings}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side B (End): Official App Logo (بالجهة المقابلة لصورة المستخدم) */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-accent-500/10 transition-all active:scale-95 group shrink-0"
          title={isAr ? 'SMART TIME — وقتك في مكان واحد' : 'SMART TIME — Your time, organized'}
          id="android-official-brand-logo-btn"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-accent-400 via-accent-500 to-accent-700 border border-accent-300/60 p-1 shadow-md shadow-accent-500/20 group-hover:scale-105 transition-transform flex items-center justify-center text-white">
            <div className="w-full h-full rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </button>

      </div>

      {/* 2. شريط الأخبار والأسعار الرقمية المباشرة (يثبت في جميع الأقسام ويختفي فقط عند فتح السيتنج) */}
      {!isSettingsOpen && activeTab !== 'settings' && (
        <>
          <div className="w-full bg-slate-100/90 dark:bg-slate-950/80 border-t border-slate-200/60 dark:border-slate-800/60 px-1 py-1 flex items-center">
            <LiveHeaderWidgets
              user={user}
              language={language}
              onGoHome={() => onNavigate('dashboard')}
              isHomeActive={isHomeActive}
            />
          </div>

          {/* 3. مربع التذكير "ذكرني" بعرض الشاشة تحت شريط الأخبار وبارتفاع ضعف شريط الأخبار تقريباً */}
          <DhakirniReminderBar
            language={language}
            tasks={dailyTasks}
            notes={notes}
            onToggleTask={(id) => onToggleDailyTask?.(id)}
            onAddTask={(task) => onAddDailyTask?.(task)}
            onDeleteTask={(id) => onDeleteDailyTask?.(id)}
            onNavigateToNotes={() => onNavigate('notes')}
          />
        </>
      )}
    </header>
  );
};
