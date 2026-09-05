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
}

const DEFAULT_SECTIONS: SectionCard[] = [
  { id: 'chat', titleAr: 'المحادثات', titleEn: 'Chat', icon: MessageSquare },
  { id: 'expenses', titleAr: 'المصاريف', titleEn: 'Expenses', icon: DollarSign },
  { id: 'trips', titleAr: 'رحلات', titleEn: 'Trips', icon: Navigation },
  { id: 'vehicles', titleAr: 'المركبة', titleEn: 'Vehicle', icon: Car },
  { id: 'education', titleAr: 'التعليم', titleEn: 'Education', icon: GraduationCap },
  { id: 'food', titleAr: 'الطعام', titleEn: 'Food', icon: Utensils },
  { id: 'sports', titleAr: 'القسم الرياضي', titleEn: 'Sports', icon: Trophy },
  { id: 'notes', titleAr: 'الملاحظات', titleEn: 'Notes', icon: FileText },
  { id: 'vault', titleAr: 'الخزانة الخاصة', titleEn: 'Secure Vault', icon: Shield },
  { id: 'ai', titleAr: 'الذكاء الاصطناعي', titleEn: 'AI Center', icon: Sparkles },
  { id: 'religious', titleAr: 'القسم الديني', titleEn: 'Religious', icon: Moon },
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
        <div className="flex items-center gap-1.5 text-xs text-[#D4AF37] bg-amber-500/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
          <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
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
              className="group relative aspect-square rounded-[22px] bg-gradient-to-b from-[#1c1c1c] to-[#282828] border border-[#D4AF37]/35 p-3.5 flex flex-col items-center justify-center text-center cursor-pointer shadow-[0_16px_32px_-8px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.15)] border-t border-t-amber-300/40 active:scale-[0.96] active:shadow-[inset_0_6px_12px_rgba(0,0,0,0.9)] active:bg-gradient-to-b active:from-[#141414] active:to-[#1e1e1e] transition-all duration-150 transform hover:-translate-y-0.5"
            >
              {section.isFavorite && (
                <div className="absolute top-2.5 left-2.5 text-[#D4AF37] z-10">
                  <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
                </div>
              )}

              <div className="absolute top-2.5 right-2.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                <GripVertical className="w-3.5 h-3.5" />
              </div>

              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#aa8c2c]/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mb-2.5 shadow-md group-hover:scale-105 transition-transform">
                <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-[#D4AF37]" />
              </div>

              <span className="text-white font-bold text-xs sm:text-sm tracking-tight line-clamp-1">
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
            className="bg-slate-900 border border-[#D4AF37]/40 rounded-3xl p-5 w-full max-w-xs shadow-2xl space-y-4"
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
                <Star className={`w-4 h-4 ${contextMenuCard.isFavorite ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-slate-400'}`} />
                <span>{contextMenuCard.isFavorite ? (isAr ? 'إزالة من المفضلة' : 'Remove from Favorites') : (isAr ? 'إضافة للمفضلة' : 'Add to Favorites')}</span>
              </button>
            </div>
            <button
              onClick={() => setContextMenuCard(null)}
              className="w-full py-2 rounded-xl bg-[#D4AF37] text-slate-950 font-bold text-xs shadow hover:bg-[#c29e2f] transition-all"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
