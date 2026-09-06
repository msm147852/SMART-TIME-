import React, { useState, useEffect } from 'react';
import { UserProfile, Expense, Note, Recipe, Vehicle, ChatRoom, AppView } from '../types';
import {
  MessageSquare,
  DollarSign,
  Navigation,
  Car,
  GraduationCap,
  Utensils,
  Trophy,
  FileText,
  Shield,
  Sparkles,
  Moon,
  Star,
  GripVertical,
} from 'lucide-react';
import { calculateUserAge, getUserZodiac } from '../utils/liveInfoHelpers';

interface DashboardViewProps {
  user: UserProfile;
  expenses: Expense[];
  notes: Note[];
  recipes: Recipe[];
  vehicles: Vehicle[];
  chatRooms: ChatRoom[];
  onNavigate: (tab: AppView, subView?: string) => void;
  onOpenSearch: () => void;
  onOpenVoiceSearch: () => void;
}

interface SectionCard {
  id: AppView;
  titleAr: string;
  titleEn: string;
  icon: React.ComponentType<{ className?: string }>;
  isFavorite?: boolean;
  emoji: string;
  tone: string;
}

const DEFAULT_SECTIONS: SectionCard[] = [
  { id: 'chat', titleAr: 'المحادثات', titleEn: 'Chat', icon: MessageSquare, emoji: '💬', tone: 'chat' },
  { id: 'expenses', titleAr: 'المصاريف', titleEn: 'Expenses', icon: DollarSign, emoji: '💰', tone: 'expenses' },
  { id: 'trips', titleAr: 'رحلات', titleEn: 'Trips', icon: Navigation, emoji: '🧭', tone: 'trips' },
  { id: 'vehicles', titleAr: 'المركبة', titleEn: 'Vehicle', icon: Car, emoji: '🚗', tone: 'vehicles' },
  { id: 'education', titleAr: 'التعليم', titleEn: 'Education', icon: GraduationCap, emoji: '📚', tone: 'education' },
  { id: 'food', titleAr: 'الطعام', titleEn: 'Food', icon: Utensils, emoji: '🍽️', tone: 'food' },
  { id: 'sports', titleAr: 'القسم الرياضي', titleEn: 'Sports', icon: Trophy, emoji: '🏆', tone: 'sports' },
  { id: 'notes', titleAr: 'الملاحظات', titleEn: 'Notes', icon: FileText, emoji: '📝', tone: 'notes' },
  { id: 'vault', titleAr: 'الخزانة الخاصة', titleEn: 'Secure Vault', icon: Shield, emoji: '🔐', tone: 'vault' },
  { id: 'ai', titleAr: 'الذكاء الاصطناعي', titleEn: 'AI Center', icon: Sparkles, emoji: '✨', tone: 'ai' },
  { id: 'religious', titleAr: 'القسم الديني', titleEn: 'Religious', icon: Moon, emoji: '🌙', tone: 'religious' },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  onNavigate,
}) => {
  const isAr = user.language === 'ar';

  // Load section order and favorites from localStorage
  const [sections, setSections] = useState<SectionCard[]>(() => {
    try {
      const saved = localStorage.getItem('smart_time_dashboard_sections');
      if (saved) {
        const parsed = JSON.parse(saved);
        return DEFAULT_SECTIONS.map((def) => {
          const found = parsed.find((p: any) => p.id === def.id);
          return found ? { ...def, isFavorite: found.isFavorite } : def;
        });
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_SECTIONS;
  });

  const [draggedId, setDraggedId] = useState<AppView | null>(null);
  const [contextMenuCard, setContextMenuCard] = useState<SectionCard | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        'smart_time_dashboard_sections',
        JSON.stringify(sections.map((s) => ({ id: s.id, isFavorite: s.isFavorite })))
      );
    } catch (e) {}
  }, [sections]);

  const handleCardClick = (id: AppView) => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      try {
        window.navigator.vibrate(15);
      } catch (e) {}
    }
    onNavigate(id);
  };

  const toggleFavorite = (id: AppView, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s))
    );
    setContextMenuCard(null);
  };

  const handleDragStart = (e: React.DragEvent, id: AppView) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: AppView) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = sections.findIndex((s) => s.id === draggedId);
    const targetIndex = sections.findIndex((s) => s.id === targetId);

    if (draggedIndex < 0 || targetIndex < 0) return;

    const newSections = [...sections];
    const [removed] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, removed);

    setSections(newSections);
    setDraggedId(null);
  };

  return (
    <div
      className="w-full min-h-full flex flex-col pb-16 select-none animate-fade-in space-y-4"
      id="android-dashboard-grid-view"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Top Greeting & Favorites Count */}
      <div className="px-1 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {isAr ? `مرحباً، ${user.name || 'مستخدم SMART TIME'}` : `Welcome, ${user.name || 'User'}`}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isAr ? 'الأقسام الرئيسية - وقتك من ذهب' : 'Main Sections - Your Time is Gold'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-accent-500 bg-accent-500/10 px-2.5 py-1 rounded-full border border-accent-500/30">
          <Star className="w-3.5 h-3.5 fill-accent-500 text-accent-500" />
          <span>{sections.filter((s) => s.isFavorite).length} {isAr ? 'مفضلات' : 'Favorites'}</span>
        </div>
      </div>

      {/* Grid of Square 3D Neumorphic Cards (2 or 3 columns) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 w-full">
        {sections.map((section) => {
          const IconComponent = section.icon;
          return (
            <div
              key={section.id}
              draggable
              onDragStart={(e) => handleDragStart(e, section.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, section.id)}
              onClick={() => handleCardClick(section.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenuCard(section);
              }}
              className={`dashboard-section-card dashboard-section-${section.tone} group relative aspect-square rounded-[22px] border p-3 flex flex-col items-center justify-center text-center cursor-pointer active:scale-[0.97] transition-all duration-150 transform hover:-translate-y-0.5`}
            >
              {section.isFavorite && (
                <div className="absolute top-2.5 left-2.5 text-accent-500 z-10">
                  <Star className="w-3.5 h-3.5 fill-accent-500" />
                </div>
              )}

              <div className="absolute top-2.5 right-2.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                <GripVertical className="w-3.5 h-3.5" />
              </div>

              <div className="dashboard-section-emoji relative w-11 h-8 sm:w-12 sm:h-9 rounded-xl flex items-center justify-center text-2xl sm:text-[27px] leading-none mb-2" aria-hidden="true">{section.emoji}<span className="dashboard-section-mini-icon absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-current ring-2 ring-white dark:ring-slate-900" /></div>

              <div className="dashboard-section-icon w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                <IconComponent className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
              </div>

              <span className="dashboard-section-title font-bold text-xs sm:text-sm tracking-tight line-clamp-1">
                {isAr ? section.titleAr : section.titleEn}
              </span>
            </div>
          );
        })}
      </div>

      {/* Context Menu Modal / Sheet for Long Press */}
      {contextMenuCard && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" onClick={() => setContextMenuCard(null)}>
          <div
            className="bg-slate-900 border border-accent-500/40 rounded-3xl p-5 w-full max-w-xs shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                {isAr ? contextMenuCard.titleAr : contextMenuCard.titleEn}
              </h3>
              <button onClick={() => setContextMenuCard(null)} className="text-slate-400 hover:text-white text-xs">
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={(e) => toggleFavorite(contextMenuCard.id, e)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <Star className={`w-4 h-4 ${contextMenuCard.isFavorite ? 'fill-accent-500 text-accent-500' : 'text-slate-400'}`} />
                <span>{contextMenuCard.isFavorite ? (isAr ? 'إزالة من المفضلة' : 'Remove from Favorites') : (isAr ? 'إضافة للمفضلة' : 'Add to Favorites')}</span>
              </button>
            </div>
            <button
              onClick={() => setContextMenuCard(null)}
              className="w-full py-2 rounded-xl bg-accent-500 text-slate-950 font-bold text-xs shadow hover:bg-accent-600 transition-all"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
