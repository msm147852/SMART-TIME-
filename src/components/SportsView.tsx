import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Trophy, Dumbbell, Flame, Footprints, Heart, Plus, Activity, Award, Shield, CheckCircle2 } from 'lucide-react';

interface SportsViewProps {
  user: UserProfile;
}

interface WorkoutItem {
  id: string;
  title: string;
  category: string;
  duration: number; // minutes
  calories: number;
  date: string;
}

export const SportsView: React.FC<SportsViewProps> = ({ user }) => {
  const isAr = user.language === 'ar';

  const [workouts, setWorkouts] = useState<WorkoutItem[]>([
    { id: '1', title: isAr ? 'جري خفيف صباحي' : 'Morning Light Jog', category: isAr ? 'كارديو' : 'Cardio', duration: 30, calories: 280, date: 'اليوم' },
    { id: '2', title: isAr ? 'تمارين حديد (أرجل وبطن)' : 'Weight Training (Legs & Core)', category: isAr ? 'قوة' : 'Strength', duration: 45, calories: 350, date: 'أمس' },
    { id: '3', title: isAr ? 'جلسة إطالة وتكييف بدني' : 'Stretching & Mobility', category: isAr ? 'مرونة' : 'Mobility', duration: 20, calories: 120, date: 'قبل يومين' },
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState('30');
  const [newCalories, setNewCalories] = useState('200');
  const [newCategory, setNewCategory] = useState(isAr ? 'كارديو' : 'Cardio');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const item: WorkoutItem = {
      id: Date.now().toString(),
      title: newTitle,
      category: newCategory,
      duration: parseInt(newDuration) || 30,
      calories: parseInt(newCalories) || 150,
      date: isAr ? 'اليوم' : 'Today',
    };
    setWorkouts([item, ...workouts]);
    setNewTitle('');
    setIsAdding(false);
  };

  return (
    <div className="w-full space-y-4 pb-20 animate-fade-in text-slate-100">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1a1a1a] via-[#242424] to-[#1a1a1a] p-5 border border-[#D4AF37]/30 shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 mb-2">
              <Trophy className="w-3.5 h-3.5 text-[#D4AF37]" />
              {isAr ? 'القسم الرياضي واللياقة' : 'Sports & Fitness Hub'}
            </span>
            <h1 className="text-xl font-black text-white">
              {isAr ? 'صحتك ولياقتك البدنية' : 'Health & Fitness Dashboard'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isAr ? 'تابع تمارينك الرياضية، خطواتك اليومية، وحرق السعرات' : 'Track your workouts, steps & daily calories'}
            </p>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#aa8c2c] text-slate-950 font-bold text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            {isAr ? 'إضافة تمرين' : 'Add Workout'}
          </button>
        </div>
      </div>

      {/* Fitness Stats Overview */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 text-center shadow-lg">
          <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#D4AF37]">
            <Footprints className="w-5 h-5" />
          </div>
          <div className="text-lg font-black font-mono-num text-white">8,432</div>
          <div className="text-[11px] text-slate-400 font-medium">{isAr ? 'خطوات اليوم' : 'Daily Steps'}</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 text-center shadow-lg">
          <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <Flame className="w-5 h-5" />
          </div>
          <div className="text-lg font-black font-mono-num text-white">750</div>
          <div className="text-[11px] text-slate-400 font-medium">{isAr ? 'سعر حراري' : 'Calories Burned'}</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 text-center shadow-lg">
          <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Heart className="w-5 h-5" />
          </div>
          <div className="text-lg font-black font-mono-num text-white">72 bpm</div>
          <div className="text-[11px] text-slate-400 font-medium">{isAr ? 'نبضات القلب' : 'Heart Rate'}</div>
        </div>
      </div>

      {/* Add Workout Form Modal / Card */}
      {isAdding && (
        <form onSubmit={handleAddWorkout} className="bg-slate-900 border border-[#D4AF37]/40 rounded-2xl p-4 shadow-xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[#D4AF37]" />
              {isAr ? 'تسجيل تمرين جديد' : 'Log New Workout'}
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">{isAr ? 'اسم التمرين' : 'Workout Name'}</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={isAr ? 'مثال: تمارين صدر، سباحة، جري...' : 'e.g., Chest workout, swimming...'}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">{isAr ? 'المدة (دقيقة)' : 'Duration (min)'}</label>
              <input
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">{isAr ? 'السعرات' : 'Calories'}</label>
              <input
                type="number"
                value={newCalories}
                onChange={(e) => setNewCalories(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">{isAr ? 'التصنيف' : 'Category'}</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value={isAr ? 'كارديو' : 'Cardio'}>{isAr ? 'كارديو' : 'Cardio'}</option>
                <option value={isAr ? 'قوة' : 'Strength'}>{isAr ? 'قوة' : 'Strength'}</option>
                <option value={isAr ? 'مرونة' : 'Mobility'}>{isAr ? 'مرونة' : 'Mobility'}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-[#D4AF37] text-slate-950 text-xs font-bold shadow hover:bg-[#c29e2f]"
            >
              {isAr ? 'حفظ التمرين' : 'Save Workout'}
            </button>
          </div>
        </form>
      )}

      {/* Workouts History List */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          {isAr ? 'سجل التمارين الأخيرة' : 'Recent Workouts'}
        </h2>
        {workouts.map((w) => (
          <div
            key={w.id}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-[#D4AF37]/30 transition-all shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#aa8c2c]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{w.title}</h4>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">{w.category}</span>
                  <span>• {w.date}</span>
                </div>
              </div>
            </div>
            <div className="text-left font-mono-num">
              <div className="text-xs font-bold text-[#D4AF37]">{w.duration} {isAr ? 'دقيقة' : 'min'}</div>
              <div className="text-[11px] text-slate-400">{w.calories} {isAr ? 'سعر حراري' : 'kcal'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
