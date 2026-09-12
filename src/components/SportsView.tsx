import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { Trophy, Dumbbell, Flame, Footprints, Heart, Plus, Activity, Award, Shield, CheckCircle2, RefreshCw, Radio } from 'lucide-react';
import { fetchLiveSports, LiveSportsMatch } from '../services/liveDataService';

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
  const [liveMatches, setLiveMatches] = useState<LiveSportsMatch[]>([]);
  const [sportsLoading, setSportsLoading] = useState(true);
  const [sportsUpdatedAt, setSportsUpdatedAt] = useState<Date | null>(null);

  const refreshLiveSports = async () => {
    setSportsLoading(true);
    const data = await fetchLiveSports();
    setLiveMatches(data);
    if (data.length) setSportsUpdatedAt(new Date());
    setSportsLoading(false);
  };

  useEffect(() => {
    refreshLiveSports();
    const timer = window.setInterval(refreshLiveSports, 15_000);
    return () => window.clearInterval(timer);
  }, []);

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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1a1a1a] via-[#242424] to-[#1a1a1a] p-5 border border-accent-500/30 shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-500/20 text-accent-500 border border-accent-500/30 mb-2">
              <Trophy className="w-3.5 h-3.5 text-accent-500" />
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-accent-500 to-accent-700 text-slate-950 font-bold text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            {isAr ? 'إضافة تمرين' : 'Add Workout'}
          </button>
        </div>
      </div>

      {/* Live Internet Scores */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500"><Radio className="w-5 h-5" /></span>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">{isAr ? 'النتائج المباشرة' : 'Live Scores'}</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{sportsUpdatedAt ? (isAr ? `تحديث ${sportsUpdatedAt.toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}` : `Updated ${sportsUpdatedAt.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}`) : (isAr ? 'جاري الاتصال بالإنترنت…' : 'Connecting…')}</p>
            </div>
          </div>
          <button onClick={refreshLiveSports} disabled={sportsLoading} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <RefreshCw className={`w-4 h-4 ${sportsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {liveMatches.slice(0, 8).map((match, i) => (
            <div key={`${match.fixture?.id || 'match'}-${i}`} className="p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] text-slate-500 truncate">{match.league?.name || (isAr ? 'مباراة' : 'Fixture')}</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{match.teams?.home?.name || 'Home'}</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{match.teams?.away?.name || 'Away'}</div>
              </div>
              <div className="text-center shrink-0">
                <div className="font-mono-num text-lg font-black text-accent-500">{match.goals?.home ?? '-'} : {match.goals?.away ?? '-'}</div>
                <div className="text-[10px] font-bold text-red-500">{match.fixture?.status?.short || 'LIVE'} {match.fixture?.status?.elapsed ? `${match.fixture.status.elapsed}'` : ''}</div>
              </div>
            </div>
          ))}
          {!sportsLoading && liveMatches.length === 0 && (
            <div className="p-5 text-xs text-slate-500">{isAr ? 'لا توجد مباريات مباشرة الآن أو مزود النتائج غير متاح.' : 'No live matches right now or the score provider is unavailable.'}</div>
          )}
        </div>
      </section>

      { /* Fitness Stats Overview */ }
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 text-center shadow-lg">
          <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-accent-500/10 border border-accent-500/30 flex items-center justify-center text-accent-500">
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
        <form onSubmit={handleAddWorkout} className="bg-slate-900 border border-accent-500/40 rounded-2xl p-4 shadow-xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-accent-500" />
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
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-500"
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
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">{isAr ? 'السعرات' : 'Calories'}</label>
              <input
                type="number"
                value={newCalories}
                onChange={(e) => setNewCalories(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">{isAr ? 'التصنيف' : 'Category'}</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-500"
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
              className="px-4 py-1.5 rounded-xl bg-accent-500 text-slate-950 text-xs font-bold shadow hover:bg-accent-600"
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
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-accent-500/30 transition-all shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500/20 to-accent-700/10 border border-accent-500/30 flex items-center justify-center text-accent-500">
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
              <div className="text-xs font-bold text-accent-500">{w.duration} {isAr ? 'دقيقة' : 'min'}</div>
              <div className="text-[11px] text-slate-400">{w.calories} {isAr ? 'سعر حراري' : 'kcal'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
