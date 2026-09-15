import React, { useEffect, useMemo, useState } from 'react';
import {
  Trophy, Dumbbell, Heart, Search, Newspaper, CheckCircle2, Trash2,
  ExternalLink, RefreshCw, Activity, ArrowRight, Play, Bike, Waves,
  Footprints, Shield, Timer, ChevronDown, Sparkles
} from 'lucide-react';
import { UserProfile } from '../types';
import { fetchLiveNews, fetchLiveSports, LiveNewsArticle, LiveSportsMatch } from '../services/liveDataService';
import { apiUrl } from '../services/apiConfig';

interface SportsViewProps { user: UserProfile; }
interface ExerciseItem {
  id: string; name: string; gifUrl: string; target: string; equipment: string;
  bodyPart?: string; secondaryMuscles?: string[]; instructions?: string[];
}
interface WorkoutLog { id:string; title:string; category:string; duration:number; calories:number; date:string; }

type Tab = 'home' | 'exercises' | 'favorites' | 'hobby' | 'news';

const MUSCLES = [
  { label:'الكل', value:'all' }, { label:'الصدر', value:'chest' }, { label:'الظهر', value:'back' },
  { label:'الأكتاف', value:'shoulders' }, { label:'الذراعين', value:'upper arms' },
  { label:'الأرجل', value:'upper legs' }, { label:'البطن', value:'waist' },
];
const HOBBIES = [
  {name:'كرة القدم', icon:Trophy}, {name:'كمال الأجسام', icon:Dumbbell}, {name:'السباحة', icon:Waves},
  {name:'الجري', icon:Footprints}, {name:'كرة السلة', icon:Activity}, {name:'ركوب الدراجات', icon:Bike},
];

function readStorage<T>(key:string, fallback:T):T {
  try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}

export const SportsView: React.FC<SportsViewProps> = ({ user }) => {
  const isAr = user.language === 'ar';
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [exerciseError, setExerciseError] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [favorites, setFavorites] = useState<ExerciseItem[]>(() => readStorage('my_favorite_workouts', []));
  const [completed, setCompleted] = useState<string[]>(() => readStorage('my_completed_workouts', []));
  const [selectedHobby, setSelectedHobby] = useState('كرة القدم');
  const [searchQuery, setSearchQuery] = useState('');
  const [news, setNews] = useState<LiveNewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [liveMatches, setLiveMatches] = useState<LiveSportsMatch[]>([]);
  const [sportsLoading, setSportsLoading] = useState(false);
  const [workouts, setWorkouts] = useState<WorkoutLog[]>(() => readStorage('smart_time_workout_logs', [
    {id:'seed-1', title:'جري خفيف صباحي', category:'كارديو', duration:30, calories:280, date:'اليوم'},
    {id:'seed-2', title:'تمارين حديد (أرجل وبطن)', category:'قوة', duration:45, calories:350, date:'أمس'},
  ]));
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState('30');
  const [newCalories, setNewCalories] = useState('200');

  useEffect(() => { window.localStorage.setItem('my_favorite_workouts', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { window.localStorage.setItem('my_completed_workouts', JSON.stringify(completed)); }, [completed]);
  useEffect(() => { window.localStorage.setItem('smart_time_workout_logs', JSON.stringify(workouts)); }, [workouts]);

  const loadExercises = async (muscle = selectedMuscle) => {
    setLoading(true); setExerciseError('');
    try {
      const q = muscle === 'all' ? '' : `?bodyPart=${encodeURIComponent(muscle)}`;
      const res = await fetch(apiUrl(`/api/sports/exercises${q}`));
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'تعذر تحميل التمارين');
      setExercises(Array.isArray(data) ? data : []);
    } catch (e:any) {
      setExercises([]); setExerciseError(e?.message || 'تعذر الاتصال بمكتبة التمارين.');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (activeTab === 'exercises') loadExercises(selectedMuscle); }, [activeTab, selectedMuscle]);

  const loadNews = async () => {
    setNewsLoading(true);
    const data = await fetchLiveNews(isAr ? 'ar' : 'en');
    setNews(data); setNewsLoading(false);
  };
  const loadLive = async () => { setSportsLoading(true); setLiveMatches(await fetchLiveSports()); setSportsLoading(false); };
  useEffect(() => { if (activeTab === 'news') { loadNews(); loadLive(); } }, [activeTab]);

  const toggleFavorite = (exercise: ExerciseItem) => {
    setFavorites(prev => prev.some(x => x.id === exercise.id) ? prev.filter(x => x.id !== exercise.id) : [...prev, exercise]);
  };
  const toggleComplete = (id:string) => setCompleted(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const go = (tab:Tab) => setActiveTab(tab);
  const handleSearch = (e:React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = encodeURIComponent(`${selectedHobby} ${searchQuery}`);
    window.open(`https://www.google.com/search?q=${q}`, '_blank', 'noopener,noreferrer');
  };
  const handleYoutubeSearch = () => {
    if (!searchQuery.trim()) return;
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(`${selectedHobby} ${searchQuery}`)}`, '_blank', 'noopener,noreferrer');
  };
  const addWorkout = (e:React.FormEvent) => {
    e.preventDefault(); if (!newTitle.trim()) return;
    setWorkouts(prev => [{id:Date.now().toString(), title:newTitle.trim(), category:'تمرين', duration:Number(newDuration)||30, calories:Number(newCalories)||200, date:'اليوم'}, ...prev]);
    setNewTitle(''); setIsAdding(false);
  };

  const filteredFavorites = useMemo(() => favorites, [favorites]);

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="w-full space-y-5 pb-24 animate-fade-in text-slate-900 dark:text-white">
      <div className="rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center"><Dumbbell className="w-6 h-6 text-slate-900 dark:text-white" /></div>
            <div><div className="text-xs font-bold text-slate-500">SMART TIME</div><h1 className="text-xl font-black">المركز الرياضي التفاعلي</h1><p className="text-xs text-slate-500 mt-1">تمارينك، متابعتك، هواياتك وأخبار الرياضة في مكان واحد</p></div>
          </div>
          {activeTab !== 'home' && <button onClick={() => go('home')} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs font-bold"><ArrowRight className="w-4 h-4" /> الرئيسية</button>}
        </div>
      </div>

      {activeTab === 'home' && <>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {tab:'exercises' as Tab, icon:Dumbbell, title:'مكتبة التمارين المصورة', text:'تمارين للصدر والظهر والأكتاف والذراعين والأرجل والبطن مع صور GIF.', action:'استكشف التمارين'},
            {tab:'favorites' as Tab, icon:Heart, title:'متابعة تمارينك المفضلة', text:'كل ما حفظته في مكان واحد مع تحديد التمارين المكتملة وحذفها.', action:`عرض المحفوظ (${favorites.length})`},
            {tab:'hobby' as Tab, icon:Trophy, title:'هوايتك ومحرك البحث', text:'اختر رياضتك وابحث مباشرة في Google أو YouTube عن التدريب والمحتوى.', action:'ابدأ البحث'},
            {tab:'news' as Tab, icon:Newspaper, title:'أخبار الرياضة وكرة القدم', text:'أخبار ونتائج ومباريات مباشرة من مصادر الإنترنت المتاحة في SMART TIME.', action:'تصفح الأخبار'},
          ].map((card) => <button key={card.tab} onClick={() => go(card.tab)} className="text-right group rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-4"><card.icon className="w-6 h-6" /></div>
            <h2 className="font-black text-lg">{card.title}</h2><p className="text-sm text-slate-500 mt-2 leading-6">{card.text}</p><div className="mt-5 text-xs font-black">{card.action} ←</div>
          </button>)}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[['8,432','خطوات اليوم',Footprints],['750','سعر حراري',Activity],['72 bpm','نبضات القلب',Heart]].map(([value,label,Icon]) => <div key={String(label)} className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 text-center"><Icon className="w-5 h-5 mx-auto mb-2"/><div className="font-black text-lg">{value}</div><div className="text-[11px] text-slate-500">{label}</div></div>)}
        </div>
      </>}

      {activeTab === 'exercises' && <section className="space-y-4">
        <div className="rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex flex-wrap gap-2">{MUSCLES.map(m => <button key={m.value} onClick={() => setSelectedMuscle(m.value)} className={`px-4 py-2 rounded-xl text-xs font-black border transition ${selectedMuscle===m.value ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>{m.label}</button>)}</div>
          <div className="mt-4 flex items-center justify-between"><p className="text-xs text-slate-500">مصدر التمارين: ExerciseDB عبر خادم SMART TIME</p><button onClick={() => loadExercises()} disabled={loading} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900"><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/></button></div>
        </div>
        {exerciseError && <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 p-4 text-sm">{exerciseError}<div className="text-xs mt-1">أضف RAPIDAPI_KEY في ملف البيئة ثم أعد تشغيل الخادم.</div></div>}
        {loading ? <div className="py-16 text-center text-slate-500"><RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3"/>جاري تحميل التمارين والصور المتحركة...</div> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{exercises.map(item => {const fav=favorites.some(x=>x.id===item.id); return <article key={item.id} className="overflow-hidden rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm"><div className="relative h-56 bg-slate-50 dark:bg-white flex items-center justify-center"><img src={item.gifUrl} alt={item.name} className="max-h-full max-w-full object-contain" loading="lazy"/><button onClick={() => toggleFavorite(item)} className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/95 shadow flex items-center justify-center"><Heart className={`w-5 h-5 ${fav?'fill-red-500 text-red-500':''}`}/></button></div><div className="p-4"><h3 className="font-black text-base capitalize">{item.name}</h3><div className="grid grid-cols-2 gap-2 mt-3 text-[11px]"><span className="rounded-xl bg-slate-100 dark:bg-slate-900 p-2">العضلة: <b>{item.target}</b></span><span className="rounded-xl bg-slate-100 dark:bg-slate-900 p-2">الأداة: <b>{item.equipment}</b></span></div><button onClick={() => toggleFavorite(item)} className={`w-full mt-3 py-2.5 rounded-xl text-xs font-black ${fav?'bg-red-50 text-red-600':'bg-slate-900 text-white dark:bg-white dark:text-slate-900'}`}>{fav?'♥ في المفضلة':'♡ إضافة إلى المفضلة'}</button></div></article>})}</div>}
      </section>}

      {activeTab === 'favorites' && <section className="rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5"><h2 className="font-black text-lg flex items-center gap-2"><Heart className="text-red-500"/> تمارينك المفضلة ({filteredFavorites.length})</h2>{filteredFavorites.length===0 ? <div className="py-16 text-center text-slate-500">لا توجد تمارين محفوظة بعد. افتح مكتبة التمارين واضغط القلب.</div> : <div className="mt-5 space-y-3">{filteredFavorites.map(item=>{const done=completed.includes(item.id);return <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 p-3"><img src={item.gifUrl} alt={item.name} className="w-20 h-20 object-contain rounded-xl bg-white"/><div className="flex-1 min-w-0"><h3 className={`font-black text-sm ${done?'line-through text-slate-400':''}`}>{item.name}</h3><p className="text-xs text-slate-500 mt-1">{item.target} • {item.equipment}</p><div className="flex gap-2 mt-2"><button onClick={()=>toggleComplete(item.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${done?'bg-emerald-50 text-emerald-700':'bg-slate-100 dark:bg-slate-900'}`}><CheckCircle2 className="inline w-4 h-4 ml-1"/>{done?'مكتمل':'تم الإنجاز'}</button><button onClick={()=>toggleFavorite(item)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600"><Trash2 className="inline w-4 h-4 ml-1"/>حذف</button></div></div></div>})}</div>}</section>}

      {activeTab === 'hobby' && <section className="max-w-4xl mx-auto rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5"><h2 className="font-black text-lg flex items-center gap-2"><Trophy/> هوايتك الرياضية</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-5">{HOBBIES.map(h=>{const I=h.icon;return <button key={h.name} onClick={()=>setSelectedHobby(h.name)} className={`p-3 rounded-2xl border text-sm font-bold flex items-center gap-2 ${selectedHobby===h.name?'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900':'border-slate-200 dark:border-slate-700'}`}><I className="w-4 h-4"/>{h.name}</button>})}</div><form onSubmit={handleSearch} className="flex gap-2 mt-6"><input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder={`ابحث عن أي شيء في ${selectedHobby}...`} className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none"/><button className="px-5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black text-sm"><Search className="inline w-4 h-4 ml-1"/> Google</button></form><button onClick={handleYoutubeSearch} className="w-full mt-2 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-sm"><Play className="inline w-4 h-4 ml-1"/> البحث في YouTube</button></section>}

      {activeTab === 'news' && <section className="space-y-4"><div className="flex items-center justify-between"><h2 className="font-black text-lg flex items-center gap-2"><Newspaper/> أخبار الرياضة</h2><button onClick={()=>{loadNews();loadLive();}} className="p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><RefreshCw className={`w-4 h-4 ${newsLoading||sportsLoading?'animate-spin':''}`}/></button></div><div className="rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden"><div className="p-4 border-b border-slate-200 dark:border-slate-800 font-black text-sm">النتائج المباشرة</div>{liveMatches.slice(0,8).map((m,i)=><div key={`${m.fixture?.id||i}`} className="p-3 border-b last:border-0 border-slate-100 dark:border-slate-800 flex justify-between"><div className="text-xs"><div className="text-slate-500">{m.league?.name||'مباراة'}</div><b>{m.teams?.home?.name||'Home'}</b><br/><b>{m.teams?.away?.name||'Away'}</b></div><div className="font-black">{m.goals?.home??'-'} : {m.goals?.away??'-'}</div></div>)}{!sportsLoading&&!liveMatches.length&&<div className="p-5 text-sm text-slate-500">لا توجد مباريات مباشرة الآن أو مزود النتائج غير متاح.</div>}</div><div className="space-y-3">{newsLoading?<div className="py-10 text-center text-slate-500">جاري تحميل الأخبار...</div>:news.length?news.map((n,i)=><a key={`${n.url}-${i}`} href={n.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:shadow-sm"><div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0"><Newspaper className="w-5 h-5"/></div><div className="flex-1"><h3 className="font-bold text-sm leading-6">{n.title}</h3><p className="text-[11px] text-slate-500 mt-1">{n.source?.name||'مصدر إخباري'}</p></div><ExternalLink className="w-4 h-4 shrink-0"/></a>):<div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-500">لم تصل أخبار مباشرة حاليًا.</div>}</div></section>}

      {isAdding && <form onSubmit={addWorkout} className="fixed inset-x-4 bottom-4 z-50 max-w-lg mx-auto rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-5 shadow-2xl"><div className="flex items-center justify-between mb-4"><h3 className="font-black">تسجيل تمرين</h3><button type="button" onClick={()=>setIsAdding(false)}>✕</button></div><input autoFocus value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="اسم التمرين" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent mb-2"/><div className="grid grid-cols-2 gap-2"><input type="number" value={newDuration} onChange={e=>setNewDuration(e.target.value)} placeholder="الدقائق" className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent"/><input type="number" value={newCalories} onChange={e=>setNewCalories(e.target.value)} placeholder="السعرات" className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent"/></div><button className="w-full mt-3 py-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black">حفظ التمرين</button></form>}
      {activeTab==='home' && <button onClick={()=>setIsAdding(true)} className="fixed bottom-5 left-5 z-40 rounded-full px-4 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black shadow-xl"><PlusIcon/> إضافة تمرين</button>}
    </div>
  );
};
function PlusIcon(){ return <span className="inline-block ml-1">＋</span>; }
