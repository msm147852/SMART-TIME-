import React, { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, ChefHat, Clock, Heart, Search, ShoppingCart, Sparkles, Tag, UtensilsCrossed, X } from 'lucide-react';
import { FoodMainSection, FoodSubcategory, DietSystem, Language, Recipe, ShoppingItem } from '../types';
import { FoodRepository } from '../services';
import { DETAILED_FOOD_CATEGORIES, DetailedCategory, DetailedRecipe } from '../data/detailedFoodLibrary';

interface FoodViewProps {
  language: Language;
  recipes: Recipe[];
  shoppingList: ShoppingItem[];
  onUpdateRecipes: (recipes: Recipe[]) => void;
  onUpdateShoppingList: (items: ShoppingItem[]) => void;
}

type Screen = 'home' | 'section' | 'recipes' | 'recipe' | 'shopping' | 'detailed-list' | 'detailed-recipe';

const mainCards: { id: FoodMainSection; title: string; subtitle: string; emoji: string }[] = [
  { id: 'eastern', title: 'الأكلات الشرقية', subtitle: 'أكلات مصرية وشرقية مرتبة حسب نوع الطبق', emoji: '🍲' },
  { id: 'eastern_desserts', title: 'الحلويات الشرقية', subtitle: 'حلويات ومعجنات حلوة ووصفات تقليدية', emoji: '🍰' },
  { id: 'diet', title: 'الدايت', subtitle: 'كيتو، نظام الطيبات، والأنظمة المشاعة', emoji: '🥗' },
];
const subCards: { id: FoodSubcategory; title: string; emoji: string }[] = [
  { id: 'starches', title: 'نشويات', emoji: '🍚' },
  { id: 'pastries', title: 'معجنات', emoji: '🥐' },
  { id: 'desserts', title: 'حلويات', emoji: '🍮' },
];
const dietCards: { id: DietSystem; title: string; emoji: string }[] = [
  { id: 'keto', title: 'كيتو دايت', emoji: '🥩' },
  { id: 'tayyibat', title: 'نظام الطيبات', emoji: '🌿' },
  { id: 'common', title: 'كل الأنظمة المشاعة', emoji: '🍽️' },
];

const fallbackImage = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80';

export const FoodView: React.FC<FoodViewProps> = ({ language, recipes, shoppingList, onUpdateRecipes, onUpdateShoppingList }) => {
  const isAr = language === 'ar';
  const [screen, setScreen] = useState<Screen>('home');
  const [section, setSection] = useState<FoodMainSection | null>(null);
  const [subcategory, setSubcategory] = useState<FoodSubcategory | null>(null);
  const [diet, setDiet] = useState<DietSystem | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [search, setSearch] = useState('');
  const [shoppingText, setShoppingText] = useState('');
  const [detailedCategory, setDetailedCategory] = useState<DetailedCategory | null>(null);
  const [selectedDetailedRecipe, setSelectedDetailedRecipe] = useState<DetailedRecipe | null>(null);
  const [detailedFavorites, setDetailedFavorites] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('smart-time-detailed-food-favorites') || '[]'); } catch { return []; } });

  const ensureCatalog = useMemo(() => {
    // Existing saved recipes remain untouched. The new catalog fields are additive.
    return recipes;
  }, [recipes]);

  const visibleRecipes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ensureCatalog.filter(r => {
      const mainOk = !section || r.mainSection === section;
      const subOk = !subcategory || r.subcategory === subcategory;
      const dietOk = !diet || r.dietSystems?.includes(diet);
      const text = `${r.title} ${r.tags?.join(' ') || ''} ${r.ingredients.map(i => i.name).join(' ')}`.toLowerCase();
      return mainOk && subOk && dietOk && (!q || text.includes(q));
    });
  }, [ensureCatalog, section, subcategory, diet, search]);

  const saveRecipes = (next: Recipe[]) => { onUpdateRecipes(next); FoodRepository.saveRecipes(next); };
  const toggleFavorite = (id: string) => saveRecipes(recipes.map(r => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));
  const goBack = () => {
    if (screen === 'detailed-recipe') return setScreen('detailed-list');
    if (screen === 'detailed-list') { setDetailedCategory(null); return setScreen('home'); }
    if (screen === 'recipe') return setScreen('recipes');
    if (screen === 'recipes') return setScreen('section');
    if (screen === 'section') { setSection(null); setSubcategory(null); setDiet(null); return setScreen('home'); }
    setScreen('home');
  };
  const openDetailedCategory = (cat: DetailedCategory) => { if (cat.id === 'tayyibat') { setSection('diet'); setSubcategory(null); setDiet('tayyibat'); setSearch(''); setScreen('recipes'); return; } setDetailedCategory(cat); setSelectedDetailedRecipe(null); setSearch(''); setScreen('detailed-list'); };
  const openDetailedRecipe = (recipe: DetailedRecipe) => { setSelectedDetailedRecipe(recipe); setScreen('detailed-recipe'); };
  const toggleDetailedFavorite = (id: string) => { setDetailedFavorites(prev => { const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]; localStorage.setItem('smart-time-detailed-food-favorites', JSON.stringify(next)); return next; }); };
  const openSection = (id: FoodMainSection) => { setSection(id); setSubcategory(null); setDiet(null); setScreen('section'); };
  const openRecipes = (sub?: FoodSubcategory, dietSystem?: DietSystem) => { setSubcategory(sub || null); setDiet(dietSystem || null); setSearch(''); setScreen('recipes'); };
  const addRecipeIngredientsToShopping = (recipe: DetailedRecipe) => {
    const nextItems = recipe.shopping.map((item, index) => ({ id: `food_recipe_${recipe.id}_${Date.now()}_${index}`, name: item.name, quantity: 1, unit: item.amount, isCompleted: false, category: recipe.title, addedFromRecipeId: recipe.id }));
    const next = [...nextItems, ...shoppingList];
    onUpdateShoppingList(next); FoodRepository.saveShoppingList(next);
  };
  const addShopping = (e: React.FormEvent) => {
    e.preventDefault(); if (!shoppingText.trim()) return;
    const next = [{ id: `food_shop_${Date.now()}`, name: shoppingText.trim(), quantity: 1, unit: 'حبة', isCompleted: false, category: 'مكونات وصفات' }, ...shoppingList];
    onUpdateShoppingList(next); FoodRepository.saveShoppingList(next); setShoppingText('');
  };

  if (screen === 'detailed-recipe' && selectedDetailedRecipe) return (
    <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
      <Header title={selectedDetailedRecipe.title} onBack={goBack} icon={<ChefHat />} />
      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <img src={selectedDetailedRecipe.image} onError={(e)=>{e.currentTarget.src=fallbackImage}} className="h-72 w-full object-cover" alt={selectedDetailedRecipe.title} />
        <div className="p-5 space-y-6">
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={()=>toggleDetailedFavorite(selectedDetailedRecipe.id)} className={`rounded-full px-4 py-2 text-xs font-black border ${detailedFavorites.includes(selectedDetailedRecipe.id)?'bg-rose-50 text-rose-600 border-rose-200':'bg-white text-slate-700 border-slate-200'}`}>{detailedFavorites.includes(selectedDetailedRecipe.id)?'♥ في المفضلة':'♡ إضافة للمفضلة'}</button>
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">{selectedDetailedRecipe.group}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{selectedDetailedRecipe.servings} أفراد</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">تحضير {selectedDetailedRecipe.prepMinutes} د</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">طهي {selectedDetailedRecipe.cookMinutes} د</span>
          </div>
          <section><h3 className="font-black text-xl mb-3">🛒 كمية الشراء</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{selectedDetailedRecipe.shopping.map((x,i)=><div key={i} className="rounded-2xl border bg-slate-50 p-3 flex items-start justify-between gap-3"><div><b>{x.name}</b>{x.note&&<div className="text-xs text-slate-500 mt-1">{x.note}</div>}</div><span className="font-black text-orange-700 whitespace-nowrap">{x.amount}</span></div>)}</div><button onClick={()=>addRecipeIngredientsToShopping(selectedDetailedRecipe)} className="mt-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white">إضافة مكونات الوصفة لقائمة المشتريات</button></section>
          <section><h3 className="font-black text-xl mb-3">🥣 المكونات</h3><div className="space-y-2">{selectedDetailedRecipe.ingredients.map((x,i)=><div key={i} className="rounded-2xl border p-3"><div className="font-black">{x.name}</div><div className="text-sm text-slate-600 mt-1">الكمية: {x.amount}{x.note ? ` — ${x.note}` : ''}</div></div>)}</div></section>
          {selectedDetailedRecipe.marinade && <section><h3 className="font-black text-xl mb-3">🧂 التتبيلة بالتفصيل</h3><ol className="space-y-2">{selectedDetailedRecipe.marinade.map((x,i)=><li key={i} className="rounded-2xl bg-orange-50 border border-orange-100 p-3 text-sm"><b>{i+1}.</b> {x}</li>)}</ol></section>}
          <section><h3 className="font-black text-xl mb-3">👨‍🍳 طريقة التحضير والطهي</h3><ol className="space-y-3">{selectedDetailedRecipe.cooking.map((x,i)=><li key={i} className="flex gap-3 rounded-2xl border p-4"><span className="w-8 h-8 shrink-0 rounded-full bg-orange-500 text-white flex items-center justify-center font-black">{i+1}</span><span className="pt-1 text-sm leading-7">{x}</span></li>)}</ol></section>
          {selectedDetailedRecipe.tips && <section><h3 className="font-black text-xl mb-3">💡 أسرار النجاح</h3><ul className="space-y-2">{selectedDetailedRecipe.tips.map((x,i)=><li key={i} className="rounded-2xl bg-emerald-50 p-3 text-sm">✓ {x}</li>)}</ul></section>}
        </div>
      </div>
    </div>
  );

  if (screen === 'detailed-list' && detailedCategory) return (
    <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
      <Header title={detailedCategory.title} onBack={goBack} icon={<UtensilsCrossed />} />
      <div className="rounded-3xl border bg-white p-5 shadow-sm"><div className="flex gap-3 items-center"><span className="text-5xl">{detailedCategory.emoji}</span><div><h2 className="text-xl font-black">{detailedCategory.title}</h2><p className="text-sm text-slate-500 mt-1">{detailedCategory.subtitle}</p></div></div></div>
      <div className="flex gap-2 rounded-2xl bg-white p-2 border"><Search className="m-2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث عن وصفة أو مكون..." className="w-full outline-none"/></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{detailedCategory.recipes.filter(x=>!search.trim() || `${x.title} ${x.group} ${x.ingredients.map(i=>i.name).join(' ')}`.includes(search.trim())).map(recipe=><DetailedRecipeCard key={recipe.id} recipe={recipe} isFavorite={detailedFavorites.includes(recipe.id)} onFavorite={()=>toggleDetailedFavorite(recipe.id)} onOpen={()=>openDetailedRecipe(recipe)}/>)}</div>
    </div>
  );

  if (screen === 'recipe' && selectedRecipe) return (
    <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
      <Header title={selectedRecipe.title} onBack={goBack} />
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <img src={selectedRecipe.image || fallbackImage} onError={(e) => { e.currentTarget.src = fallbackImage; }} className="h-64 w-full object-cover" alt="" />
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">{(selectedRecipe.tags || []).map(t => <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">#{t}</span>)}</div>
            <button onClick={() => toggleFavorite(selectedRecipe.id)} className="rounded-xl border p-2"><Heart className={selectedRecipe.isFavorite ? 'fill-current text-rose-500' : ''} /></button>
          </div>
          {selectedRecipe.notes && <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">{selectedRecipe.notes}</div>}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <Info label="التحضير" value={`${selectedRecipe.prepTimeMinutes} د`} />
            <Info label="الطهي" value={`${selectedRecipe.cookTimeMinutes} د`} />
            <Info label="الحصص" value={String(selectedRecipe.servings || '—')} />
            <Info label="التصنيف" value={selectedRecipe.subcategory === 'starches' ? 'نشويات' : selectedRecipe.subcategory === 'pastries' ? 'معجنات' : 'حلويات'} />
          </div>
          <div><h3 className="font-black text-lg mb-2">المكونات</h3>{selectedRecipe.ingredients.length ? <ul className="space-y-2">{selectedRecipe.ingredients.map((i, n) => <li key={n} className="rounded-xl bg-slate-50 p-3 text-sm">{i.name} — {i.amount} {i.unit}</li>)}</ul> : <p className="text-sm text-slate-500">المصدر المرفوع يعرض هذه الوصفة كملخص؛ سيتم استكمال التفاصيل عند إضافة بيانات المصدر الكاملة.</p>}</div>
          <div><h3 className="font-black text-lg mb-2">طريقة التحضير / الملخص</h3><ol className="space-y-2 list-decimal pr-5">{selectedRecipe.steps.map((s, n) => <li key={n} className="text-sm text-slate-700">{s}</li>)}</ol></div>
          <div className="border-t pt-4 text-xs text-slate-500">المصدر: {selectedRecipe.source || 'قاعدة SMART TIME'}{selectedRecipe.sourcePage ? ` — صفحة ${selectedRecipe.sourcePage}` : ''}</div>
        </div>
      </div>
    </div>
  );

  if (screen === 'shopping') return (
    <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}><Header title="قائمة المشتريات" onBack={goBack} icon={<ShoppingCart />} />
      <form onSubmit={addShopping} className="flex gap-2"><input value={shoppingText} onChange={e => setShoppingText(e.target.value)} placeholder="أضف مكوناً للقائمة" className="flex-1 rounded-2xl border p-3" /><button className="rounded-2xl bg-slate-900 px-5 font-bold text-white">إضافة</button></form>
      <div className="space-y-2">{shoppingList.map(i => <div key={i.id} className="flex items-center gap-3 rounded-2xl border bg-white p-3"><input type="checkbox" checked={i.isCompleted} onChange={() => { const n=shoppingList.map(x=>x.id===i.id?{...x,isCompleted:!x.isCompleted}:x); onUpdateShoppingList(n); FoodRepository.saveShoppingList(n); }} /><span className={i.isCompleted?'line-through text-slate-400':''}>{i.name}</span></div>)}</div>
    </div>
  );

  if (screen === 'recipes') return (
    <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
      <Header title={diet ? dietCards.find(x=>x.id===diet)?.title || '' : subcategory ? subCards.find(x=>x.id===subcategory)?.title || '' : 'الوصفات'} onBack={goBack} />
      <div className="flex gap-2 rounded-2xl bg-white p-2 border"><Search className="m-2 text-slate-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث عن وصفة أو مكون" className="w-full outline-none" /></div>
      {diet === 'tayyibat' && <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-900">تصنيف الطيبات هنا مبني على قائمة المسموحات/الممنوعات في المصدر، وليس حكماً طبياً مستقلاً.</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{visibleRecipes.map(r => <RecipeCard key={r.id} recipe={r} onOpen={()=>{setSelectedRecipe(r);setScreen('recipe')}} onFavorite={()=>toggleFavorite(r.id)} />)}</div>
      {!visibleRecipes.length && <div className="rounded-3xl border bg-white p-10 text-center text-slate-500">لا توجد وصفات بهذا التصنيف حالياً.</div>}
    </div>
  );

  if (screen === 'section') return (
    <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
      <Header title={mainCards.find(x=>x.id===section)?.title || 'الطعام'} onBack={goBack} />
      {section === 'diet' ? <><SectionTitle text="اختار النظام" /> <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{dietCards.map(c=><button key={c.id} onClick={()=>openRecipes(undefined,c.id)} className="rounded-3xl border bg-white p-6 text-center shadow-sm hover:shadow-md"><div className="text-4xl mb-3">{c.emoji}</div><div className="font-black">{c.title}</div><div className="text-xs text-slate-500 mt-1">نشويات • معجنات • حلويات</div></button>)}</div></> : <><SectionTitle text="اختار نوع الوصفة" /> <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{subCards.map(c=><button key={c.id} onClick={()=>openRecipes(c.id)} className="rounded-3xl border bg-white p-6 text-center shadow-sm hover:shadow-md"><div className="text-4xl mb-3">{c.emoji}</div><div className="font-black">{c.title}</div></button>)}</div></>}
    </div>
  );

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="rounded-3xl border bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-4"><div><h1 className="text-2xl font-black flex items-center gap-2"><span className="rounded-2xl bg-orange-50 p-3">🍽️</span> قسم الطعام</h1><p className="mt-1 text-sm text-slate-500">مكتبة منظمة: محاشي • مشويات • مشروبات • عصائر • مخبوزات • سلطات، بالإضافة إلى الأكلات المصرية والطيبات.</p></div><button onClick={()=>setScreen('shopping')} className="rounded-2xl border px-4 py-3 text-sm font-bold flex items-center gap-2"><ShoppingCart className="w-4" /> المشتريات</button></div></div>
      <section><div className="mb-3 flex items-center gap-2"><span className="w-2 h-7 rounded-full bg-rose-500"/><h2 className="text-xl font-black">⭐ المفضلة</h2></div><div className="rounded-3xl border bg-white p-5 shadow-sm">{detailedFavorites.length ? <div className="flex flex-wrap gap-2">{DETAILED_FOOD_CATEGORIES.flatMap(c=>c.recipes).filter(r=>detailedFavorites.includes(r.id)).map(r=><button key={r.id} onClick={()=>openDetailedRecipe(r)} className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">♥ {r.title}</button>)}</div> : <p className="text-sm text-slate-500">لم تضف أطباقًا للمفضلة بعد. اضغط ♡ على أي وصفة وستظهر هنا.</p>}</div></section>
      <section><div className="mb-3 flex items-center gap-2"><span className="w-2 h-7 rounded-full bg-orange-500"/><h2 className="text-xl font-black">🍽️ مكتبة الطعام الرئيسية</h2></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{DETAILED_FOOD_CATEGORIES.map(c=><button key={c.id} onClick={()=>openDetailedCategory(c)} className="overflow-hidden rounded-3xl border bg-white text-right shadow-sm hover:shadow-md transition"><img src={c.recipes[0]?.image || fallbackImage} onError={(e)=>{e.currentTarget.src=fallbackImage}} className="h-44 w-full object-cover" alt=""/><div className="p-5"><div className="flex items-center gap-3"><span className="text-4xl">{c.emoji}</span><div><h3 className="font-black text-lg">{c.title}</h3><p className="text-xs text-slate-500 mt-1">{c.recipes.length} وصفة تفصيلية</p></div></div><p className="mt-3 text-sm text-slate-500 leading-6">{c.subtitle}</p><div className="mt-4 text-xs font-black text-orange-600">فتح القسم ←</div></div></button>)}</div></section>
      <section><div className="mb-3 flex items-center gap-2"><span className="w-2 h-7 rounded-full bg-emerald-500"/><h2 className="text-xl font-black">الأقسام الغذائية والأنظمة</h2></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{mainCards.map(c=><button key={c.id} onClick={()=>openSection(c.id)} className="rounded-3xl border bg-white p-6 text-right shadow-sm hover:shadow-md transition"><div className="text-5xl mb-4">{c.emoji}</div><h2 className="text-lg font-black">{c.title}</h2><p className="mt-2 text-sm text-slate-500">{c.subtitle}</p><div className="mt-5 flex items-center gap-2 text-xs font-bold text-orange-600">فتح القسم <ArrowRight className="w-4" /></div></button>)}</div></section>
      <div className="rounded-3xl border bg-slate-50 p-5"><div className="flex items-center gap-2 font-black"><Sparkles className="w-5" /> تنظيم قاعدة الطعام</div><p className="text-sm text-slate-500 mt-2 leading-6">كل وصفة تفصيلية تحتوي على صورة، كمية شراء، مكونات، تتبيلة عند الحاجة، خطوات تحضير وطهي، ونصائح. ويمكن إضافة مكونات الوصفة مباشرة إلى قائمة المشتريات.</p></div>
    </div>
  );
};

const DetailedRecipeCard=({recipe,onOpen,isFavorite,onFavorite}:{recipe:DetailedRecipe,onOpen:()=>void,isFavorite:boolean,onFavorite:()=>void})=><div className="overflow-hidden rounded-3xl border bg-white text-right shadow-sm hover:shadow-md transition"><button onClick={onOpen} className="block w-full text-right"><img src={recipe.image} onError={(e)=>{e.currentTarget.src=fallbackImage}} className="h-48 w-full object-cover" alt={recipe.title}/><div className="p-4"><div className="text-xs font-bold text-orange-600">{recipe.group}</div><h3 className="font-black text-lg mt-1">{recipe.title}</h3><div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500"><span>👥 {recipe.servings}</span><span>⏱️ {recipe.prepMinutes + recipe.cookMinutes} د</span><span>🛒 {recipe.shopping.length} مكونات</span></div></div></button><div className="px-4 pb-4 flex items-center justify-between"><button onClick={onOpen} className="text-xs font-black text-orange-600">عرض التفاصيل ←</button><button onClick={onFavorite} className={`rounded-xl border px-3 py-2 text-sm font-black ${isFavorite?'text-rose-600 bg-rose-50 border-rose-200':'text-slate-600 bg-white border-slate-200'}`}>{isFavorite?'♥':'♡'} {isFavorite?'مفضلة':'مفضلة'}</button></div></div>;
const Header=({title,onBack,icon}:{title:string,onBack:()=>void,icon?:React.ReactNode})=><div className="flex items-center gap-3"><button onClick={onBack} className="rounded-2xl border bg-white p-3"><ArrowRight /></button><div className="flex items-center gap-2"><span className="rounded-xl bg-orange-50 p-2 text-orange-600">{icon||<ChefHat className="w-5"/>}</span><h1 className="text-2xl font-black">{title}</h1></div></div>;
const SectionTitle=({text}:{text:string})=><div className="rounded-2xl bg-white border p-4 font-black">{text}</div>;
const Info=({label,value}:{label:string,value:string})=><div className="rounded-2xl bg-slate-50 p-3"><div className="text-[11px] text-slate-500">{label}</div><div className="font-black mt-1">{value}</div></div>;
const RecipeCard=({recipe,onOpen,onFavorite}:{recipe:Recipe,onOpen:()=>void,onFavorite:()=>void})=><div className="overflow-hidden rounded-3xl border bg-white shadow-sm"><button onClick={onOpen} className="block w-full text-right"><img src={recipe.image||fallbackImage} onError={(e)=>{e.currentTarget.src=fallbackImage}} className="h-48 w-full object-cover" alt=""/><div className="p-4"><h3 className="font-black text-lg">{recipe.title}</h3><div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500"><span className="flex items-center gap-1"><Clock className="w-3"/>{recipe.cookTimeMinutes} د</span>{recipe.source&&<span className="flex items-center gap-1"><BookOpen className="w-3"/> مصدر</span>}</div></div></button><div className="px-4 pb-4 flex items-center justify-between"><span className="text-xs font-bold text-orange-600">عرض الوصفة</span><button onClick={(e)=>{e.stopPropagation();onFavorite()}} className="rounded-xl border p-2"><Heart className={recipe.isFavorite?'fill-current text-rose-500':'w-4'} /></button></div></div>;
