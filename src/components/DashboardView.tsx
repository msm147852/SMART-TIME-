import React from 'react';
import { UserProfile, Expense, Note, Recipe, Vehicle, ChatRoom } from '../types';

interface DashboardViewProps {
  user: UserProfile;
  expenses: Expense[];
  notes: Note[];
  recipes: Recipe[];
  vehicles: Vehicle[];
  chatRooms: ChatRoom[];
  onNavigate: (tab: string, subView?: string) => void;
  onOpenSearch: () => void;
  onOpenVoiceSearch: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
}) => {
  const isAr = user.language === 'ar';

  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-4 text-center select-none" id="android-dashboard-clean-slate">
      {/* تم إفراغ الواجهة الرئيسية تماماً مع الإبقاء على الشريط العلوي لبدء البناء والتصميم حسب طلب المستخدم */}
      <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
        <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mb-3" />
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
          {isAr ? 'الواجهة الرئيسية جاهزة للتصميم' : 'Main Android Screen Ready'}
        </span>
      </div>
    </div>
  );
};
