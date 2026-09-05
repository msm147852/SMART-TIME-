import React, { useState, useEffect } from 'react';
import {
  AppView,
  Language,
  ThemeMode,
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
  Recipe,
  ShoppingItem,
  AthkarItem,
  SecureRecord,
  MediaFolder,
  MediaItem,
  FavoritePlace,
  RecentTrip,
  ChatRoom,
  AppNotification,
} from './types';
import {
  UserRepository,
  NotesRepository,
  ExpensesRepository,
  VehiclesRepository,
  EducationRepository,
  FoodRepository,
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
import { VehiclesView } from './components/VehiclesView';
import { EducationView } from './components/EducationView';
import { FoodView } from './components/FoodView';
import { ReligiousView } from './components/ReligiousView';
import { SecureVaultView } from './components/SecureVaultView';
import { AiCenterView } from './components/AiCenterView';
import { HotChatView } from './components/HotChatView';
import { MediaCenterView } from './components/MediaCenterView';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { VoiceSearchModal } from './components/VoiceSearchModal';
import { SettingsAndBackupModal } from './components/SettingsAndBackupModal';
import { NotificationsModal } from './components/NotificationsModal';

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
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [viewHistory, setViewHistory] = useState<AppView[]>([]);
  const [language, setLanguage] = useState<Language>('ar');
  const [theme, setTheme] = useState<ThemeMode>('light');

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
  const [recipes, setRecipes] = useState<Recipe[]>(() => FoodRepository.getRecipes());
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => FoodRepository.getShoppingList());
  const [athkarItems, setAthkarItems] = useState<AthkarItem[]>(() => ReligiousRepository.getAthkarItems());
  const [secureRecords, setSecureRecords] = useState<SecureRecord[]>(() => VaultRepository.getRecords());
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>(() => ChatRepository.getChatRooms());
  const [mediaFolders, setMediaFolders] = useState<MediaFolder[]>(() => MediaRepository.getFolders());
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => MediaRepository.getItems());
  const [favoritePlaces, setFavoritePlaces] = useState<FavoritePlace[]>(() => TripsRepository.getFavoritePlaces());
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>(() => TripsRepository.getRecentTrips());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => NotificationsRepository.getNotifications());

  // Setup Theme & RTL
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center sm:p-3 selection:bg-amber-500 selection:text-white">
      {/* Authentic Android Mobile Smartphone Shell */}
      <div className="relative w-full sm:max-w-[430px] h-screen sm:h-[93vh] sm:max-h-[915px] bg-white dark:bg-slate-900 sm:rounded-[44px] shadow-2xl sm:ring-1 sm:ring-slate-800 sm:border-[8px] sm:border-slate-800 flex flex-col overflow-hidden">
        
        {/* 1. Android Status Bar (الساعة بالدقائق والساعات فقط) */}
        <AndroidStatusBar
          language={language}
          unreadNotifications={notifications.filter((n) => !n.isRead).length}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
        />

        {/* 2. Top Android App Toolbar & Live Header Widgets Ribbon */}
        <NavigationHeader
          user={userProfile}
          activeTab={currentView}
          onNavigate={(tab) => handleNavigate(tab as AppView)}
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
        />

        {/* 3. Main Android Viewport Container (Scrollable) */}
        <main className="flex-1 w-full overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-3.5 pb-24 scroll-smooth">
          {currentView === 'dashboard' && (
            <DashboardView
              user={userProfile}
              expenses={expenses}
              notes={notes}
              recipes={recipes}
              vehicles={vehicles}
              chatRooms={chatRooms}
              onNavigate={(tab) => handleNavigate(tab as AppView)}
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
              onUpdateNotes={(updated) => {
                setNotes(updated);
                NotesRepository.saveNotes(updated);
              }}
            />
          )}

          {currentView === 'calculator' && (
            <NotesAndAccountingView
              language={language}
              notes={notes}
              folders={noteFolders}
              tags={noteTags}
              onUpdateNotes={(updated) => {
                setNotes(updated);
                NotesRepository.saveNotes(updated);
              }}
            />
          )}

          {currentView === 'expenses' && (
            <ExpensesView
              language={language}
              currency={userProfile.currency}
              expenses={expenses}
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
            />
          )}

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

          {currentView === 'food' && (
            <FoodView
              language={language}
              recipes={recipes}
              shoppingList={shoppingList}
              onUpdateRecipes={(updated) => {
                setRecipes(updated);
                FoodRepository.saveRecipes(updated);
              }}
              onUpdateShoppingList={(updated) => {
                setShoppingList(updated);
                FoodRepository.saveShoppingList(updated);
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

          {currentView === 'chat' && <HotChatView language={language} />}

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
        </main>

        {/* 4. Android Bottom Navigation Bar (Always visible inside Android container) */}
        <nav className="shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 flex items-center justify-around z-30 select-none">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => handleNavigate(item.view)}
                className={`flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all active:scale-95 ${
                  item.highlight
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white px-3.5 py-1.5 shadow-md shadow-purple-500/25 -mt-3 ring-3 ring-white dark:ring-slate-900'
                    : isActive
                    ? 'text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 dark:bg-amber-500/15 px-3'
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
          recipes={recipes}
          onNavigate={(view) => handleNavigate(view)}
        />

        {/* Voice Search Modal */}
        <VoiceSearchModal
          isOpen={isVoiceOpen}
          onClose={() => setIsVoiceOpen(false)}
          language={language}
          onNavigate={(view) => handleNavigate(view)}
        />

        {/* Settings & Backup Modal */}
        <SettingsAndBackupModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          language={language}
          theme={theme}
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
