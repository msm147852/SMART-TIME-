import React, { useState, useEffect } from 'react';
import {
  AppView,
  Language,
  ThemeMode,
  ColorTheme,
  IconStyle,
  UserProfile,
  Note,
  NoteFolder,
  NoteTag,
  CalculatorHistoryItem,
  Expense,
  BudgetSummary,
  Vehicle,
  FuelRecord,
  MaintenanceRecord,
  Student,
  LessonItem,
  EducationExpense,
  AthkarItem,
  SecureRecord,
  MediaFolder,
  MediaItem,
  FavoritePlace,
  RecentTrip,
  ChatRoom,
  AppNotification,
  DailyTask,
} from './types';
import {
  UserRepository,
  NotesRepository,
  ExpensesRepository,
  VehiclesRepository,
  EducationRepository,
  ReligiousRepository,
  VaultRepository,
  TripsRepository,
  ChatRepository,
  MediaRepository,
  NotificationsRepository,
  BackupRepository,
} from './services';

// Components
import { AndroidStatusBar } from './components/AndroidStatusBar';
import { NavigationHeader } from './components/NavigationHeader';
import { DashboardView } from './components/DashboardView';
import { NotesAndAccountingView } from './components/NotesAndAccountingView';
import { ExpensesView } from './components/ExpensesView';
import { TripsView } from './components/TripsView';
import WalletView from './components/WalletView';
import AdminWalletPanel from './components/AdminWalletPanel';
import { VehiclesView } from './components/VehiclesView';
import { EducationView } from './components/EducationView';
import { ReligiousView } from './components/ReligiousView';
import { SecureVaultView } from './components/SecureVaultView';
import { AiCenterView } from './components/AiCenterView';
import { HotChatView } from './components/HotChatView';
import { MediaCenterView } from './components/MediaCenterView';
import { SportsView } from './components/SportsView';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { VoiceSearchModal } from './components/VoiceSearchModal';
import { SettingsAndBackupModal } from './components/SettingsAndBackupModal';
import { NotificationsModal } from './components/NotificationsModal';
import { LiveNewsPanel } from './components/LiveNewsPanel';
import { startTrialSession } from './services/authService';
import { SmartAiAction } from './services/aiService';

// Icons
import {
  LayoutDashboard,
  FileText,
  DollarSign,
  Navigation,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // Global App State
  const [authChecked, setAuthChecked] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [viewHistory, setViewHistory] = useState<AppView[]>([]);
  const [language, setLanguage] = useState<Language>('ar');
  const [theme, setTheme] = useState<ThemeMode>(() => UserRepository.getProfile().theme || 'light');
  const [colorTheme, setColorTheme] = useState<ColorTheme>('ocean');
  const [iconStyle, setIconStyle] = useState<IconStyle>(() => UserRepository.getProfile().iconStyle || 'classic');

  const handleNavigate = (nextView: AppView) => {
    if (nextView !== currentView) {
      setViewHistory((prev) => [...prev, currentView]);
      setCurrentView(nextView);
    }
  };

  const handleBack = () => {
    if (viewHistory.length > 0) {
      const prev = viewHistory[viewHistory.length - 1];
      setViewHistory((prevH) => prevH.slice(0, -1));
      setCurrentView(prev);
    } else {
      setCurrentView('dashboard');
    }
  };

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // App Data Layers using Repositories
  const [userProfile, setUserProfile] = useState<UserProfile>(() => UserRepository.getProfile());
  const [notes, setNotes] = useState<Note[]>(() => NotesRepository.getNotes());
  const [noteFolders, setNoteFolders] = useState<NoteFolder[]>(() => NotesRepository.getFolders());
  const [noteTags, setNoteTags] = useState<NoteTag[]>(() => NotesRepository.getTags());
  const [calcHistory, setCalcHistory] = useState<CalculatorHistoryItem[]>(() => NotesRepository.getCalculatorHistory());
  const [expenses, setExpenses] = useState<Expense[]>(() => ExpensesRepository.getExpenses());
  const [budget, setBudget] = useState<BudgetSummary>(() => ExpensesRepository.getBudget());
  const [monthlyIncome, setMonthlyIncome] = useState<MonthlyIncome[]>(() => ExpensesRepository.getMonthlyIncome());
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => VehiclesRepository.getVehicles());
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>(() => VehiclesRepository.getFuelRecords());
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(() =>
    VehiclesRepository.getMaintenanceRecords()
  );
  const [students, setStudents] = useState<Student[]>(() => EducationRepository.getStudents());
  const [lessons, setLessons] = useState<LessonItem[]>(() => EducationRepository.getLessons());
  const [educationExpenses, setEducationExpenses] = useState<EducationExpense[]>(() =>
    EducationRepository.getEducationExpenses()
  );
  const [athkarItems, setAthkarItems] = useState<AthkarItem[]>(() => ReligiousRepository.getAthkarItems());
  const [secureRecords, setSecureRecords] = useState<SecureRecord[]>(() => VaultRepository.getRecords());
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>(() => ChatRepository.getChatRooms());
  const [mediaFolders, setMediaFolders] = useState<MediaFolder[]>(() => MediaRepository.getFolders());
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => MediaRepository.getItems());
  const [favoritePlaces, setFavoritePlaces] = useState<FavoritePlace[]>(() => TripsRepository.getFavoritePlaces());
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>(() => TripsRepository.getRecentTrips());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => NotificationsRepository.getNotifications());
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(() => NotesRepository.getDailyTasks());
  useEffect(() => {
    // المرحلة التجريبية: تشغيل التطبيق مباشرة بدون شاشة دخول أو أي توثيق.
    startTrialSession()
      .then((session) => {
        if (session) setUserProfile(UserRepository.getProfile());
      })
      .catch((error) => {
        console.error('Trial session error:', error);
        // حتى لو فشل الاتصال بالـ API، لا نعرض شاشة دخول؛ التطبيق يظل قابلاً للاستعراض.
      })
      .finally(() => setAuthChecked(true));
  }, []);

  const handleNavigateSafe = (nextView: AppView) => handleNavigate(nextView);

  const handleApplySmartAiAction = (action: SmartAiAction) => {
    if (!action) return 'لم يتم تنفيذ أي إجراء.';
    const now = new Date().toISOString();

    if (action.type === 'add_expense') {
      const payload = action.payload;
      const safeCategory: Expense['category'] =
        ['food', 'transport', 'vehicle', 'education', 'bills', 'shopping', 'health', 'entertainment', 'other'].includes(payload.category)
          ? payload.category
          : 'other';
      const safePayment: Expense['paymentMethod'] =
        ['cash', 'card', 'wallet'].includes(payload.paymentMethod || '') ? (payload.paymentMethod as Expense['paymentMethod']) : 'cash';
      const expense: Expense = {
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? 'exp_ai_' + crypto.randomUUID() : 'exp_ai_' + Date.now(),
        title: payload.title.trim(),
        amount: Number(payload.amount),
        category: safeCategory,
        date: payload.date || now.slice(0, 10),
        paymentMethod: safePayment,
        notes: payload.notes?.trim() || undefined,
        createdAt: now,
      };
      const updated = ExpensesRepository.addExpense(expense);
      setExpenses(updated);
      return `تم تسجيل مصروف «${expense.title}» بقيمة ${expense.amount} ${userProfile.currency}.`;
    }

    if (action.type === 'add_education_expense') {
      const payload = action.payload;
      const student = payload.studentId
        ? students.find((s) => s.id === payload.studentId)
        : students.find((s) => s.name.trim() === (payload.studentName || '').trim());
      if (!student) throw new Error('لم أتمكن من تحديد الطالب المقصود.');
      const categories: EducationExpense['category'][] = ['tuition', 'lessons', 'books', 'supplies', 'transport', 'private_tutor', 'activities'];
      const category = categories.includes(payload.category) ? payload.category : 'other' as EducationExpense['category'];
      const expense: EducationExpense = {
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? 'edu_ai_' + crypto.randomUUID() : 'edu_ai_' + Date.now(),
        studentId: student.id,
        title: payload.title.trim(),
        amount: Number(payload.amount),
        category: category === 'other' as any ? 'supplies' : category,
        date: payload.date || now.slice(0, 10),
        notes: payload.notes?.trim() || undefined,
      };
      const updated = EducationRepository.addEducationExpense(expense);
      setEducationExpenses(updated);
      return `تم تسجيل مصروف تعليمي لـ«${student.name}» بقيمة ${expense.amount} ${userProfile.currency}.`;
    }

    if (action.type === 'add_fuel_record') {
      const payload = action.payload;
      const vehicle = payload.vehicleId
        ? vehicles.find((v) => v.id === payload.vehicleId)
        : vehicles.find((v) => v.name.trim() === (payload.vehicleName || '').trim());
      if (!vehicle) throw new Error('لم أتمكن من تحديد السيارة المقصودة.');
      const liters = Number(payload.liters);
      const pricePerLiter = Number(payload.pricePerLiter);
      const totalCost = Number(payload.totalCost ?? liters * pricePerLiter);
      const record: FuelRecord = {
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? 'fuel_ai_' + crypto.randomUUID() : 'fuel_ai_' + Date.now(),
        vehicleId: vehicle.id,
        liters,
        pricePerLiter,
        totalCost,
        mileage: Number(payload.mileage),
        date: payload.date || now.slice(0, 10),
        stationName: payload.stationName?.trim() || undefined,
        notes: payload.notes?.trim() || undefined,
      };
      const updated = VehiclesRepository.addFuelRecord(record);
      setFuelRecords(updated);
      return `تم تسجيل تموين «${vehicle.name}» بـ${liters} لتر بقيمة ${totalCost} ${userProfile.currency} وعلى عداد ${record.mileage} كم.`;
    }

    if (action.type === 'add_daily_task') {
      const task = {
        title: action.payload.title.trim(),
        completed: false,
        priority: action.payload.priority || 'medium',
        category: action.payload.category || 'general',
        dueDate: action.payload.dueDate,
        dueTime: action.payload.dueTime,
        noteId: action.payload.noteId,
        reminderEnabled: action.payload.reminderEnabled ?? true,
      };
      const updated = NotesRepository.addDailyTask(task);
      setDailyTasks(updated);
      return `تمت إضافة تذكير «${task.title}» إلى ذكرني.`;
    }

    return 'لم يتم تنفيذ الإجراء.';
  };


  const handleToggleDailyTask = (id: string) => {
    const updated = NotesRepository.toggleDailyTask(id);
    setDailyTasks(updated);
  };

  const handleAddDailyTask = (task: Omit<DailyTask, 'id' | 'createdAt'>) => {
    const updated = NotesRepository.addDailyTask(task);
    setDailyTasks(updated);
  };

  const handleDeleteDailyTask = (id: string) => {
    const updated = NotesRepository.deleteDailyTask(id);
    setDailyTasks(updated);
  };

  const handleUpdateDailyTasks = (updated: DailyTask[]) => {
    setDailyTasks(updated);
    NotesRepository.saveDailyTasks(updated);
  };

  // Setup Theme & RTL
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Load saved color theme once, then apply the "app style" accent theme class to <html>
  useEffect(() => {
    if (userProfile.colorTheme) setColorTheme(userProfile.colorTheme === 'gold' ? 'ocean' : userProfile.colorTheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-ocean', 'theme-gold', 'theme-facebook', 'theme-whatsapp', 'theme-telegram', 'theme-instagram', 'theme-youtube');
    root.classList.add(`theme-${colorTheme === 'gold' ? 'ocean' : colorTheme}`);
  }, [colorTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    root.setAttribute('lang', language);
  }, [language]);

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    const updated = { ...userProfile, language: newLang };
    setUserProfile(updated);
    UserRepository.saveProfile(updated);
  };

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    const updated = { ...userProfile, theme: newTheme };
    setUserProfile(updated);
    UserRepository.saveProfile(updated);
  };

  const handleIconStyleChange = (newIconStyle: IconStyle) => {
    setIconStyle(newIconStyle);
    const updated = { ...userProfile, iconStyle: newIconStyle };
    setUserProfile(updated);
    UserRepository.saveProfile(updated);
  };

  const handleColorThemeChange = (newColorTheme: ColorTheme) => {
    setColorTheme(newColorTheme);
    const updated = { ...userProfile, colorTheme: newColorTheme };
    setUserProfile(updated);
    UserRepository.saveProfile(updated);
  };

  const handleToggleTheme = () => {
    handleThemeChange(theme === 'dark' ? 'light' : 'dark');
  };

  const handleResetData = () => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من استعادة بيانات المصنع؟' : 'Reset all data to defaults?')) {
      BackupRepository.resetToDefaults();
      window.location.reload();
    }
  };

  // Android Bottom Navigation Bar Items (Material 3 Tabs)
  const bottomNavItems = [
    { view: 'dashboard' as AppView, label: language === 'ar' ? 'الرئيسية' : 'Home', icon: LayoutDashboard },
    { view: 'trips' as AppView, label: language === 'ar' ? 'المشاوير' : 'Trips', icon: Navigation },
    { view: 'ai' as AppView, label: language === 'ar' ? 'الذكاء' : 'AI', icon: Sparkles, highlight: true },
    { view: 'expenses' as AppView, label: language === 'ar' ? 'المصاريف' : 'Money', icon: DollarSign },
    { view: 'notes' as AppView, label: language === 'ar' ? 'الملاحظات' : 'Notes', icon: FileText },
  ];

  if (!authChecked) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold">جارٍ تشغيل النسخة التجريبية…</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center sm:p-3 selection:bg-accent-500 selection:text-white">
      {/* Authentic Android Mobile Smartphone Shell */}
      <div className="relative w-full sm:max-w-[430px] h-screen sm:h-[93vh] sm:max-h-[915px] bg-white dark:bg-slate-900 sm:rounded-[44px] shadow-2xl sm:ring-1 sm:ring-slate-800 sm:border-[8px] sm:border-slate-800 flex flex-col overflow-hidden">
        
        {/* 1. Android Status Bar (الساعة بالدقائق والساعات فقط) */}
        <AndroidStatusBar
          language={language}
          unreadNotifications={notifications.filter((n) => !n.isRead).length}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenPermissions={() => setIsSettingsOpen(true)}
        />

        {/* 2. Top Android App Toolbar & Live Header Widgets Ribbon */}
        <NavigationHeader
          user={userProfile}
          activeTab={currentView}
          onNavigate={(tab) => handleNavigateSafe(tab as AppView)}
          onBack={handleBack}
          language={language}
          onLanguageChange={handleLanguageChange}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenVoiceSearch={() => setIsVoiceOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isSettingsOpen={isSettingsOpen}
          notifications={notifications}
          dailyTasks={dailyTasks}
          notes={notes}
          onToggleDailyTask={handleToggleDailyTask}
          onAddDailyTask={handleAddDailyTask}
          onDeleteDailyTask={handleDeleteDailyTask}
        />

        {/* 3. Main Android Viewport Container (Scrollable) */}
        <main className="flex-1 w-full overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-3.5 pb-24 scroll-smooth">
          {currentView === 'dashboard' && (
            <DashboardView
              user={userProfile}
              expenses={expenses}
              notes={notes}
              vehicles={vehicles}
              chatRooms={chatRooms}
              onNavigate={(tab) => handleNavigateSafe(tab as AppView)}
              onOpenSearch={() => setIsSearchOpen(true)}
              onOpenVoiceSearch={() => setIsVoiceOpen(true)}
            />
          )}

          {currentView === 'notes' && (
            <NotesAndAccountingView
              language={language}
              notes={notes}
              folders={noteFolders}
              tags={noteTags}
              dailyTasks={dailyTasks}
              onUpdateNotes={(updated) => {
                setNotes(updated);
                NotesRepository.saveNotes(updated);
              }}
              onUpdateDailyTasks={handleUpdateDailyTasks}
              onToggleDailyTask={handleToggleDailyTask}
              onAddDailyTask={handleAddDailyTask}
              onDeleteDailyTask={handleDeleteDailyTask}
            />
          )}

          {currentView === 'calculator' && (
            <NotesAndAccountingView
              language={language}
              notes={notes}
              folders={noteFolders}
              tags={noteTags}
              dailyTasks={dailyTasks}
              initialTab="calculator"
              onUpdateNotes={(updated) => {
                setNotes(updated);
                NotesRepository.saveNotes(updated);
              }}
              onUpdateDailyTasks={handleUpdateDailyTasks}
              onToggleDailyTask={handleToggleDailyTask}
              onAddDailyTask={handleAddDailyTask}
              onDeleteDailyTask={handleDeleteDailyTask}
            />
          )}

          {currentView === 'expenses' && (
            <ExpensesView
              language={language}
              currency={userProfile.currency}
              expenses={expenses}
              userProfile={userProfile}
              onBackToHome={() => handleNavigateSafe('dashboard')}
              onUpdateExpenses={(updated) => {
                setExpenses(updated);
                ExpensesRepository.saveExpenses(updated);
              }}
            />
          )}

          {currentView === 'trips' && (
            <TripsView
              language={language}
              currency={userProfile.currency}
              favoritePlaces={favoritePlaces}
              recentTrips={recentTrips}
              onOpenVoiceSearch={() => setIsVoiceOpen(true)}
              onOpenWallet={() => handleNavigateSafe('wallet' as AppView)}
            />
          )}

          {currentView === 'wallet' && (
            <WalletView onOpenAdmin={() => handleNavigateSafe('admin-wallet' as AppView)} />
          )}

          {currentView === 'admin-wallet' && <AdminWalletPanel />}

          {currentView === 'vehicles' && (
            <VehiclesView
              language={language}
              currency={userProfile.currency}
              vehicles={vehicles}
              fuelRecords={fuelRecords}
              maintenanceRecords={maintenanceRecords}
              onUpdateVehicles={(updated) => {
                setVehicles(updated);
                VehiclesRepository.saveVehicles(updated);
              }}
              onUpdateFuel={(updated) => {
                setFuelRecords(updated);
                VehiclesRepository.saveFuelRecords(updated);
              }}
              onUpdateMaintenance={(updated) => {
                setMaintenanceRecords(updated);
                VehiclesRepository.saveMaintenanceRecords(updated);
              }}
            />
          )}

          {currentView === 'education' && (
            <EducationView
              language={language}
              currency={userProfile.currency}
              students={students}
              lessons={lessons}
              educationExpenses={educationExpenses}
              onUpdateStudents={(updated) => {
                setStudents(updated);
                EducationRepository.saveStudents(updated);
              }}
              onUpdateLessons={(updated) => {
                setLessons(updated);
                EducationRepository.saveLessons(updated);
              }}
              onUpdateEduExpenses={(updated) => {
                setEducationExpenses(updated);
                EducationRepository.saveEducationExpenses(updated);
              }}
            />
          )}

          {currentView === 'religious' && (
            <ReligiousView
              language={language}
              preference={userProfile.religiousPreference || 'islam'}
              athkarItems={athkarItems}
              onUpdateAthkar={(updated) => {
                setAthkarItems(updated);
                ReligiousRepository.saveAthkarItems(updated);
              }}
            />
          )}

          {currentView === 'vault' && (
            <SecureVaultView
              language={language}
              userPin={userProfile.pin || '1234'}
              secureRecords={secureRecords}
              onUpdateRecords={(updated) => {
                setSecureRecords(updated);
                VaultRepository.saveRecords(updated);
              }}
            />
          )}

          {currentView === 'ai' && (
            <AiCenterView language={language} onOpenVoiceSearch={() => setIsVoiceOpen(true)} />
          )}

          {currentView === 'chat' && (
            <HotChatView language={language} theme={theme} iconStyle={iconStyle} onNavigateHome={() => handleNavigate('dashboard')} />
          )}


          {currentView === 'media' && (
            <MediaCenterView
              language={language}
              folders={mediaFolders}
              mediaItems={mediaItems}
              onUpdateMedia={(updated) => {
                setMediaItems(updated);
                MediaRepository.saveItems(updated);
              }}
            />
          )}

          {currentView === 'sports' && (
            <SportsView user={userProfile} />
          )}

          {currentView === 'dashboard' && (
            <div className="mt-4">
              <LiveNewsPanel language={language} compact />
            </div>
          )}
        </main>

        {/* 4. Android Bottom Navigation Bar (Always visible inside Android container) */}
        <nav className="shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 flex items-center justify-around z-30 select-none">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => handleNavigateSafe(item.view)}
                className={`flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all active:scale-95 ${
                  item.highlight
                    ? isActive
                      ? 'bg-gradient-to-tr from-accent-500 to-amber-500 text-slate-950 font-bold px-3.5 py-1.5 shadow-lg shadow-accent-500/30 -mt-3 ring-3 ring-white dark:ring-slate-900 scale-105'
                      : 'bg-gradient-to-tr from-accent-600 to-amber-600 text-slate-950 font-bold px-3.5 py-1.5 shadow-md shadow-accent-500/25 -mt-3 ring-3 ring-white dark:ring-slate-900 opacity-95'
                    : isActive
                    ? 'text-accent-600 dark:text-accent-400 font-bold bg-accent-500/10 dark:bg-accent-500/15 px-3'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* 5. Android Bottom Home Gesture Pill Indicator */}
        <div className="w-full bg-white dark:bg-slate-900 py-1.5 flex justify-center items-center shrink-0 border-t border-slate-100/60 dark:border-slate-800/50">
          <div className="w-32 h-1 bg-slate-400/50 dark:bg-slate-600/60 rounded-full" />
        </div>

        {/* Universal Search Modal */}
        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          language={language}
          notes={notes}
          expenses={expenses}
          vehicles={vehicles}
          lessons={lessons}
          onNavigate={(view) => handleNavigateSafe(view)}
        />

        {/* Voice Search Modal */}
        <VoiceSearchModal
          isOpen={isVoiceOpen}
          onClose={() => setIsVoiceOpen(false)}
          language={language}
          onNavigate={(view) => handleNavigateSafe(view)}
        />

        {/* Settings & Backup Modal */}
        <SettingsAndBackupModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          language={language}
          theme={theme}
          colorTheme={colorTheme}
          iconStyle={iconStyle}
          onIconStyleChange={handleIconStyleChange}
          onColorThemeChange={handleColorThemeChange}
          userProfile={userProfile}
          onUpdateProfile={(updated) => {
            setUserProfile(updated);
            UserRepository.saveProfile(updated);
          }}
          onLanguageChange={handleLanguageChange}
          onThemeChange={handleThemeChange}
          onDataReset={handleResetData}
        />

        {/* Universal Notifications Modal (مركز الإشعارات الشامل لكل الأقسام) */}
        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
          onMarkAsRead={(id) => {
            const updated = NotificationsRepository.markAsRead(id);
            setNotifications(updated);
          }}
          onMarkAllAsRead={() => {
            const updated = NotificationsRepository.markAllAsRead();
            setNotifications(updated);
          }}
          onDeleteNotification={(id) => {
            const updated = NotificationsRepository.deleteNotification(id);
            setNotifications(updated);
          }}
          onClearAll={() => {
            const updated = NotificationsRepository.clearAll();
            setNotifications(updated);
          }}
          onNavigateToSection={(tab) => {
            handleNavigate(tab as AppView);
            setIsNotificationsOpen(false);
          }}
          language={language}
        />
      </div>
    </div>
  );
}
