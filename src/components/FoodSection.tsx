import React, { useMemo, useState } from 'react';
import {
  ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronUp,
  Clock3, Heart, List, Minus, Plus, Search, ShoppingCart, Trash2, UtensilsCrossed, X
} from 'lucide-react';
import { DETAILED_FOOD_CATEGORIES, DetailedCategory, DetailedRecipe } from '../data/detailedFoodLibrary';
import { foodImageFor } from '../data/foodImageCatalog';
import { FOOD_EXPANSION } from '../data/foodExpansion';
import { EGYPTIAN_DISHES } from '../data/egyptianDishes';
import { FoodRepository } from '../services/repositories/foodRepository';
import { StorageAdapter } from '../services/storageAdapter';
import { ShoppingItem } from '../types';
import { TAYYIBAT_ALLOWED, TAYYIBAT_FORBIDDEN, TAYYIBAT_MEAL_PLAN, TAYYIBAT_RECIPES, TAYYIBAT_RULES, TAYYIBAT_WARNING } from '../data/tayyibatSystem';

interface FoodSectionProps { onBack?: () => void; }
type Mode = 'home' | 'search' | 'favorites' | 'shopping' | 'category' | 'recipe' | 'tayyibat';
const FAV_KEY = 'smart_time_food_detailed_favorites_v4';
const localImage = (n:number) => `/food/day-${((n - 1) % 30) + 1}.webp`;

function buildCategories(): DetailedCategory[] {
  return DETAILED_FOOD_CATEGORIES.map(cat => ({
    ...cat,
    recipes: [...cat.recipes, ...(FOOD_EXPANSION[cat.id] || [])].map(recipe => ({
      ...recipe,
      image: foodImageFor(recipe),
    })),
  }));
}

export default function FoodSection({ onBack }: FoodSectionProps) {
  const categories = useMemo(buildCategories, []);
  const [mode, setMode] = useState<Mode>('home');
  const [activeCategory, setActiveCategory] = useState<DetailedCategory | null>(null);
  const [activeRecipe, setActiveRecipe] = useState<DetailedRecipe | null>(null);
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => StorageAdapter.getItem<string[]>(FAV_KEY, []));
  const [shopping, setShopping] = useState<ShoppingItem[]>(() => FoodRepository.getShoppingList());

  const allRecipes = useMemo(() => categories.flatMap(c => c.recipes), [categories]);
  const favoriteRecipes = useMemo(() => allRecipes.filter(r => favorites.includes(r.id)), [allRecipes, favorites]);

  const saveFavorites = (next:string[]) => { setFavorites(next); StorageAdapter.setItem(FAV_KEY, next); };
  const toggleFavorite = (id:string) => saveFavorites(favorites.includes(id) ? favorites.filter(x => x !== id) : [...favorites, id]);

  const refreshShopping = () => setShopping(FoodRepository.getShoppingList());
  const addRecipeToShopping = (recipe:DetailedRecipe) => {
    const existing = FoodRepository.getShoppingList();
    const newItems: ShoppingItem[] = recipe.shopping.map((item, i) => ({
      id: `food-v4-${recipe.id}-${i}-${Date.now()}`,
      name: item.name,
      quantity: 1,
      unit: item.amount + (item.note ? ` — ${item.note}` : ''),
      isCompleted: false,
      category: recipe.group,
      addedFromRecipeId: recipe.id,
    }));
    const next = FoodRepository.addShoppingItems(newItems);
    setShopping(next);
    setMode('shopping');
  };
  const toggleShopping = (id:string) => setShopping(FoodRepository.toggleShoppingItem(id));
  const deleteShopping = (id:string) => setShopping(FoodRepository.deleteShoppingItem(id));
  const clearCompleted = () => {
    const next = shopping.filter(x => !x.isCompleted);
    FoodRepository.saveShoppingList(next); setShopping(next);
  };

  const openCategory = (cat:DetailedCategory) => { setActiveCategory(cat); setQuery(''); setMode('category'); };
  const openRecipe = (recipe:DetailedRecipe) => { setActiveRecipe(recipe); setMode('recipe'); };
  const back = () => {
    if (mode === 'recipe') { setActiveRecipe(null); return setMode(activeCategory ? 'category' : 'home'); }
    if (mode === 'category') { setActiveCategory(null); return setMode('home'); }
    if (mode === 'search' || mode === 'favorites' || mode === 'shopping' || mode === 'tayyibat') return setMode('home');
    onBack?.();
  };

  const title = mode === 'home' ? 'موسوعة الطعام' : mode === 'search' ? 'البحث في الطعام' : mode === 'favorites' ? 'المفضلة' : mode === 'shopping' ? 'قائمة المشتريات' : mode === 'tayyibat' ? 'نظام الطيبات' : mode === 'recipe' ? activeRecipe?.title : activeCategory?.title;

  return <div className="min-h-full bg-slate-50" dir="rtl">
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <button onClick={back} className="w-10 h-10 shrink-0 rounded-2xl border border-slate-200 bg-white flex items-center justify-center" aria-label="رجوع"><ArrowRight className="w-5 h-5" /></button>
        <div className="w-10 h-10 shrink-0 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center"><UtensilsCrossed className="w-5 h-5" /></div>
        <div className="min-w-0 flex-1"><h1 className="font-black text-lg truncate">{title}</h1><p className="text-[11px] text-slate-500">مكتبة أكل مصرية قابلة للبحث والحفظ والشراء</p></div>
      </div>
    </header>

    {mode === 'home' && <Home categories={categories} favoritesCount={favoriteRecipes.length} shoppingCount={shopping.filter(x=>!x.isCompleted).length} onCategory={openCategory} onSearch={()=>{setQuery('');setMode('search')}} onFavorites={()=>setMode('favorites')} onShopping={()=>setMode('shopping')} onTayyibat={()=>setMode('tayyibat')} />}
    {mode === 'search' && <SearchView query={query} setQuery={setQuery} recipes={allRecipes} favorites={favorites} onFavorite={toggleFavorite} onRecipe={openRecipe} />}
    {mode === 'favorites' && <FavoritesView recipes={favoriteRecipes} favorites={favorites} onFavorite={toggleFavorite} onRecipe={openRecipe} onGoSearch={()=>setMode('search')} />}
    {mode === 'shopping' && <ShoppingView items={shopping} onToggle={toggleShopping} onDelete={deleteShopping} onClearCompleted={clearCompleted} />}
    {mode === 'category' && activeCategory && <CategoryView category={activeCategory} query={query} setQuery={setQuery} favorites={favorites} onFavorite={toggleFavorite} onRecipe={openRecipe} />}
    {mode === 'recipe' && activeRecipe && <RecipeDetail recipe={activeRecipe} favorite={favorites.includes(activeRecipe.id)} onFavorite={()=>toggleFavorite(activeRecipe.id)} onShopping={()=>addRecipeToShopping(activeRecipe)} />}
    {mode === 'tayyibat' && <TayyibatView />}

    {mode === 'home' && <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-white px-3 py-2 shadow-[0_-6px_20px_rgba(0,0,0,.06)]"><div className="max-w-5xl mx-auto grid grid-cols-3 gap-2">
      <button onClick={()=>setMode('search')} className="rounded-2xl py-2 text-xs font-black text-slate-700 hover:bg-slate-50"><Search className="w-5 h-5 mx-auto"/>البحث</button>
      <button onClick={()=>setMode('favorites')} className="rounded-2xl py-2 text-xs font-black text-rose-600 hover:bg-rose-50"><Heart className="w-5 h-5 mx-auto"/>المفضلة ({favoriteRecipes.length})</button>
      <button onClick={()=>setMode('shopping')} className="rounded-2xl py-2 text-xs font-black text-emerald-700 hover:bg-emerald-50"><ShoppingCart className="w-5 h-5 mx-auto"/>المشتريات ({shopping.filter(x=>!x.isCompleted).length})</button>
    </div></div>}
  </div>;
}

function Home({categories,favoritesCount,shoppingCount,onCategory,onSearch,onFavorites,onShopping,onTayyibat}:{categories:DetailedCategory[];favoritesCount:number;shoppingCount:number;onCategory:(c:DetailedCategory)=>void;onSearch:()=>void;onFavorites:()=>void;onShopping:()=>void;onTayyibat:()=>void}) {
  return <main className="max-w-5xl mx-auto p-4 pb-28 space-y-5">
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-4"><div className="text-5xl">📚</div><div><h2 className="text-2xl font-black">موسوعة الطعام</h2><p className="text-sm text-slate-500 mt-1">قسم منظم بدل الزحمة: اختار البطاقة، وبعدها الأطباق تظهر كقائمة قابلة للفتح والقفل.</p></div></div></section>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <ActionCard icon="🔎" title="البحث" text="ابحث في كل الوصفات" onClick={onSearch}/>
      <ActionCard icon="❤️" title="المفضلة" text={`${favoritesCount} طبق محفوظ`} onClick={onFavorites}/>
      <ActionCard icon="🛒" title="قائمة المشتريات" text={`${shoppingCount} عنصر غير مكتمل`} onClick={onShopping}/>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {categories.filter(c=>c.id!=='tayyibat').map(cat=><button key={cat.id} onClick={()=>onCategory(cat)} className="text-right rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition group"><div className="flex items-center gap-4"><div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-4xl group-hover:scale-105 transition">{cat.emoji}</div><div className="flex-1"><h3 className="font-black text-lg">{cat.title}</h3><p className="text-xs text-slate-500 mt-1">{cat.recipes.length} وصفة • {cat.subtitle}</p></div><ChevronLeft className="text-slate-400"/></div></button>)}
      <button onClick={onTayyibat} className="sm:col-span-2 text-right rounded-[26px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm"><div className="flex items-center gap-4"><div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center text-4xl">🌿</div><div className="flex-1"><h3 className="font-black text-lg text-emerald-950">نظام الطيبات</h3><p className="text-xs text-emerald-800 mt-1">القواعد والمسموحات والممنوعات والوصفات والخطة الأسبوعية</p></div><ChevronLeft className="text-emerald-700"/></div></button>
    </div>
  </main>;
}
function ActionCard({icon,title,text,onClick}:{icon:string;title:string;text:string;onClick:()=>void}){return <button onClick={onClick} className="rounded-3xl border border-slate-200 bg-white p-4 text-right shadow-sm hover:shadow-md"><div className="text-3xl">{icon}</div><div className="font-black mt-2">{title}</div><div className="text-xs text-slate-500 mt-1">{text}</div></button>}

function CategoryView({category,query,setQuery,favorites,onFavorite,onRecipe}:{category:DetailedCategory;query:string;setQuery:(v:string)=>void;favorites:string[];onFavorite:(id:string)=>void;onRecipe:(r:DetailedRecipe)=>void}){
  const filtered=useMemo(()=>category.recipes.filter(r=>`${r.title} ${r.group} ${r.ingredients.map(i=>i.name).join(' ')}`.includes(query.trim())),[category,query]);
  const [open,setOpen]=useState<string|null>(null);
  const groups=[...new Set(filtered.map(r=>r.group))];
  return <main className="max-w-4xl mx-auto p-4 pb-24 space-y-4">
    <SearchBox value={query} onChange={setQuery} placeholder="ابحث داخل القسم..."/>
    {category.id==='fish' && <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{['سمك مشوي','سمك مقلي','صواني السمك','مأكولات بحرية'].map(g=><button key={g} onClick={()=>setQuery(g)} className="rounded-2xl border bg-white py-3 text-xs font-black hover:border-emerald-300">{g}</button>)}</div>}
    <div className="rounded-2xl bg-white border p-3 text-xs text-slate-500">{filtered.length} طبق — اضغط على السطر لفتح المحتوى، واضغط مرة ثانية لإخفائه.</div>
    {groups.map(group=><section key={group} className="space-y-2"><h3 className="font-black px-1">{group}</h3>{filtered.filter(r=>r.group===group).map((recipe)=><AccordionRecipe key={recipe.id} recipe={recipe} open={open===recipe.id} onOpen={()=>setOpen(open===recipe.id?null:recipe.id)} favorite={favorites.includes(recipe.id)} onFavorite={()=>onFavorite(recipe.id)} onFull={()=>onRecipe(recipe)}/>)}</section>)}
    {!filtered.length && <Empty text="مش لاقي طبق بالمواصفات دي. جرّب اسم طبق أو مكوّن تاني."/>}
  </main>;
}
function AccordionRecipe({recipe,open,onOpen,favorite,onFavorite,onFull}:{recipe:DetailedRecipe;open:boolean;onOpen:()=>void;favorite:boolean;onFavorite:()=>void;onFull:()=>void}){
  return <article className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
    <div className="bg-slate-50 p-2">
      <img src={recipe.image} alt={recipe.title} loading="lazy" className="w-full aspect-[4/3] object-cover rounded-[22px] bg-white" onError={e=>{e.currentTarget.src='/food/food-placeholder.svg'}}/>
    </div>
    <div className="p-3">
      <div className="flex items-start gap-2">
        <button onClick={onOpen} className="flex-1 min-w-0 text-right rounded-2xl px-2 py-2 hover:bg-slate-50 transition" aria-expanded={open} aria-label={`${open?'إخفاء':'إظهار'} مكونات ${recipe.title}`}>
          <div className="font-black text-base leading-7 break-words">{recipe.title}</div>
          <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-3">
            <span>⏱️ {recipe.prepMinutes+recipe.cookMinutes} د</span><span>👥 {recipe.servings}</span>
            <span className="text-emerald-700">{open?'اضغط للاخفاء':'اضغط على الاسم للمكونات'}</span>
          </div>
        </button>
        <button onClick={e=>{e.stopPropagation();onFavorite()}} className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center ${favorite?'bg-rose-50 text-rose-600':'bg-slate-50 text-slate-400'}`} aria-label="المفضلة"><Heart className={`w-5 ${favorite?'fill-current':''}`}/></button>
      </div>
      {open && <div className="mt-2 border-t pt-3 space-y-3">
        <section className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
          <h4 className="font-black mb-2">🧺 المكونات</h4>
          <ul className="space-y-1.5 text-sm leading-6">{recipe.ingredients.map((item,i)=><li key={i} className="flex gap-2"><span className="text-emerald-600">•</span><span>{item.amount ? `${item.amount} ` : ''}{item.name}{item.note ? ` — ${item.note}` : ''}</span></li>)}</ul>
        </section>
        <button onClick={onFull} className="w-full rounded-2xl bg-slate-900 text-white py-3 font-black">فتح الوصفة كاملة</button>
      </div>}
    </div>
  </article>
}

function SearchView({query,setQuery,recipes,favorites,onFavorite,onRecipe}:{query:string;setQuery:(v:string)=>void;recipes:DetailedRecipe[];favorites:string[];onFavorite:(id:string)=>void;onRecipe:(r:DetailedRecipe)=>void}){const filtered=useMemo(()=>query.trim()?recipes.filter(r=>`${r.title} ${r.group} ${r.category} ${r.ingredients.map(i=>i.name).join(' ')}`.includes(query.trim())):recipes,[recipes,query]);return <main className="max-w-4xl mx-auto p-4 pb-24 space-y-4"><SearchBox value={query} onChange={setQuery} placeholder="مثال: ملوخية، حمام، فتة، قلقاس، فراخ..."/><div className="rounded-2xl bg-white border p-3 text-xs text-slate-500">{query?`نتيجة البحث: ${filtered.length}`:`كل المكتبة: ${filtered.length} وصفة`}</div><div className="space-y-2">{filtered.map(r=><AccordionSearch key={r.id} recipe={r} favorite={favorites.includes(r.id)} onFavorite={()=>onFavorite(r.id)} onRecipe={()=>onRecipe(r)}/>)}</div>{!filtered.length&&<Empty text="لا توجد نتائج. جرّب كلمة مختلفة."/>}</main>}
function AccordionSearch({recipe,favorite,onFavorite,onRecipe}:{recipe:DetailedRecipe;favorite:boolean;onFavorite:()=>void;onRecipe:()=>void}){return <div className="rounded-2xl border bg-white p-3 flex items-center gap-3"><img src={recipe.image} alt="" className="w-16 h-14 rounded-xl object-cover" onError={e=>{e.currentTarget.src=localImage(1)}}/><div className="flex-1"><div className="font-black">{recipe.title}</div><div className="text-xs text-slate-500">{recipe.category} • {recipe.group}</div></div><button onClick={onFavorite} className={favorite?'text-rose-600':'text-slate-300'}><Heart className={`w-5 ${favorite?'fill-current':''}`}/></button><button onClick={onRecipe} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black">فتح</button></div>}

function FavoritesView({recipes,favorites,onFavorite,onRecipe,onGoSearch}:{recipes:DetailedRecipe[];favorites:string[];onFavorite:(id:string)=>void;onRecipe:(r:DetailedRecipe)=>void;onGoSearch:()=>void}){return <main className="max-w-4xl mx-auto p-4 pb-24 space-y-4">{!recipes.length?<div className="rounded-3xl border bg-white p-10 text-center"><Heart className="w-10 h-10 mx-auto text-slate-300"/><h2 className="font-black mt-3">لسه مفيش مفضلات</h2><p className="text-sm text-slate-500 mt-1">اضغط ❤️ بجوار أي طبق، وهيظهر هنا فورًا.</p><button onClick={onGoSearch} className="mt-5 rounded-2xl bg-slate-900 text-white px-5 py-3 font-black">اذهب للبحث</button></div>:recipes.map(r=><AccordionSearch key={r.id} recipe={r} favorite={favorites.includes(r.id)} onFavorite={()=>onFavorite(r.id)} onRecipe={()=>onRecipe(r)}/>)}</main>}

function RecipeDetail({recipe,favorite,onFavorite,onShopping}:{recipe:DetailedRecipe;favorite:boolean;onFavorite:()=>void;onShopping:()=>void}){return <main className="max-w-4xl mx-auto p-4 pb-24 space-y-4"><article className="rounded-[28px] overflow-hidden border bg-white shadow-sm"><img src={recipe.image} alt={recipe.title} className="w-full aspect-[16/9] md:aspect-[4/3] object-contain bg-slate-100 p-2" onError={e=>{e.currentTarget.src=localImage(1)}}/><div className="p-5 space-y-6"><div className="flex items-start gap-3"><div className="flex-1"><span className="text-xs font-black text-emerald-700">{recipe.group}</span><h2 className="text-3xl font-black mt-1">{recipe.title}</h2></div><button onClick={onFavorite} className={`w-12 h-12 rounded-2xl flex items-center justify-center ${favorite?'bg-rose-50 text-rose-600':'bg-slate-100 text-slate-500'}`}><Heart className={`w-6 ${favorite?'fill-current':''}`}/></button></div><div className="grid grid-cols-3 gap-2"><Info label="التحضير" value={`${recipe.prepMinutes} د`}/><Info label="الطهي" value={`${recipe.cookMinutes} د`}/><Info label="يكفي" value={`${recipe.servings} أفراد`}/></div><section><h3 className="font-black text-lg mb-3">🛒 كمية الشراء</h3><div className="space-y-2">{recipe.shopping.map((x,i)=><div key={i} className="rounded-2xl border bg-slate-50 p-3 flex justify-between gap-3"><span className="font-bold">{x.name}</span><span className="text-sm text-slate-600">{x.amount}{x.note?` — ${x.note}`:''}</span></div>)}</div></section>{recipe.marinade&&<section><h3 className="font-black text-lg mb-3">🥣 التتبيلة / التأسيس</h3><ul className="space-y-2">{recipe.marinade.map((x,i)=><li key={i} className="rounded-2xl bg-amber-50 border border-amber-100 p-3 text-sm">{x}</li>)}</ul></section>}<section><h3 className="font-black text-lg mb-3">🥘 طريقة التحضير والطهي بالتفصيل</h3><ol className="space-y-3">{recipe.cooking.map((x,i)=><li key={i} className="flex gap-3"><span className="w-7 h-7 rounded-full bg-emerald-600 text-white shrink-0 flex items-center justify-center text-xs font-black">{i+1}</span><span className="text-sm leading-7">{x}</span></li>)}</ol></section>{recipe.tips&&<section><h3 className="font-black text-lg mb-3">💡 أسرار ونصائح</h3><div className="space-y-2">{recipe.tips.map((x,i)=><div key={i} className="rounded-2xl bg-blue-50 border border-blue-100 p-3 text-sm">{x}</div>)}</div></section>}<button onClick={onShopping} className="w-full rounded-2xl bg-emerald-600 text-white py-3.5 font-black flex items-center justify-center gap-2"><ShoppingCart className="w-5"/>أضف كل مكونات الطبق لقائمة المشتريات</button></div></article></main>}

function ShoppingView({items,onToggle,onDelete,onClearCompleted}:{items:ShoppingItem[];onToggle:(id:string)=>void;onDelete:(id:string)=>void;onClearCompleted:()=>void}){return <main className="max-w-3xl mx-auto p-4 pb-24 space-y-4"><div className="rounded-3xl border bg-white p-5"><div className="flex items-center gap-3"><ShoppingCart className="w-7 h-7 text-emerald-700"/><div className="flex-1"><h2 className="text-xl font-black">قائمة المشتريات</h2><p className="text-xs text-slate-500">أي وصفة تضيفها ستظهر هنا فورًا.</p></div>{items.some(x=>x.isCompleted)&&<button onClick={onClearCompleted} className="text-xs font-black text-rose-600">حذف المكتمل</button>}</div></div>{!items.length?<Empty text="القائمة فاضية حاليًا. افتح أي وصفة واضغط أضف للمشتريات."/>:<div className="space-y-2">{items.map(item=><div key={item.id} className={`rounded-2xl border bg-white p-3 flex items-center gap-3 ${item.isCompleted?'opacity-60':''}`}><button onClick={()=>onToggle(item.id)} className={`w-9 h-9 rounded-xl border flex items-center justify-center ${item.isCompleted?'bg-emerald-600 text-white':'bg-white'}`}>{item.isCompleted?<Check className="w-5"/>:<span/>}</button><div className="flex-1"><div className={`font-bold ${item.isCompleted?'line-through':''}`}>{item.name}</div><div className="text-xs text-slate-500">{item.unit} {item.category?`• ${item.category}`:''}</div></div><button onClick={()=>onDelete(item.id)} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-5"/></button></div>)}</div>}</main>}
function SearchBox({value,onChange,placeholder}:{value:string;onChange:(v:string)=>void;placeholder:string}){return <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm"><Search className="w-5 text-slate-400 mt-1 shrink-0"/><input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="w-full outline-none text-sm bg-transparent"/><button onClick={()=>onChange('')} className="text-slate-300 hover:text-slate-500"><X className="w-4"/></button></div>}
function Empty({text}:{text:string}){return <div className="rounded-3xl border bg-white p-10 text-center text-slate-500">{text}</div>}

function TayyibatView(){const [tab,setTab]=useState<'overview'|'allowed'|'forbidden'|'recipes'|'plan'>('overview');const tabs=[['overview','نظرة عامة'],['allowed','المسموحات'],['forbidden','الممنوعات'],['recipes','الوصفات'],['plan','الخطة الأسبوعية']] as const;return <main className="max-w-4xl mx-auto p-4 pb-24 space-y-4"><div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5"><h2 className="font-black text-lg text-emerald-950">🌿 التقرير المدمج</h2><p className="text-sm text-emerald-900 mt-1">المحتوى منظم في تبويبات بدل نص طويل.</p></div><div className="flex gap-2 overflow-x-auto">{tabs.map(([id,t])=><button key={id} onClick={()=>setTab(id)} className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-black border ${tab===id?'bg-slate-900 text-white':'bg-white'}`}>{t}</button>)}</div>{tab==='overview'&&<div className="space-y-3">{TAYYIBAT_RULES.map(([name,desc],i)=><div key={i} className="rounded-2xl border bg-white p-4 text-sm"><b>{name}</b><div className="text-slate-600 mt-1">{desc}</div></div>)}<div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm">{TAYYIBAT_WARNING}</div></div>}{tab==='allowed'&&<div className="grid sm:grid-cols-3 gap-3">{(['يومي','أسبوعي','عرضي'] as const).map(f=><div key={f} className="rounded-3xl border bg-white p-4"><h3 className="font-black mb-3">{f}</h3>{TAYYIBAT_ALLOWED.filter(x=>x.frequency===f).map(x=><div key={x.name} className="text-sm py-1.5 flex gap-2"><CheckCircle2 className="w-4 text-emerald-600 shrink-0"/>{x.name}</div>)}</div>)}</div>}{tab==='forbidden'&&<div className="space-y-2">{TAYYIBAT_FORBIDDEN.map(([n,r])=><div key={n} className="rounded-2xl border bg-white p-4"><b>{n}</b><div className="text-sm text-slate-500 mt-1">{r}</div></div>)}</div>}{tab==='recipes'&&<div className="space-y-2">{TAYYIBAT_RECIPES.map(x=><div key={x.id} className="rounded-2xl border bg-white p-4"><b>{x.title}</b><div className="text-sm mt-2">{x.ingredients.join(' • ')}</div><ol className="mt-2 text-sm text-slate-600 list-decimal pr-5">{x.steps.map((s,i)=><li key={i}>{s}</li>)}</ol></div>)}</div>}{tab==='plan'&&<div className="space-y-2">{TAYYIBAT_MEAL_PLAN.map(([day,breakfast,lunch,dinner],i)=><div key={i} className="rounded-2xl border bg-white p-4"><b>{day}</b><div className="text-sm mt-2"><div>الإفطار: {breakfast}</div><div>الغداء: {lunch}</div><div>العشاء: {dinner}</div></div></div>)}</div>}</main>}
