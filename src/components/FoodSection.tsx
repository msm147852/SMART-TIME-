import React, { useMemo, useState } from 'react';
import {
  ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronUp,
  Clock3, Heart, List, Minus, Plus, Search, ShoppingCart, Trash2, UtensilsCrossed, X
} from 'lucide-react';
import { DETAILED_FOOD_CATEGORIES, DetailedCategory, DetailedRecipe } from '../data/detailedFoodLibrary';
import { foodImageFor, validateRecipeImage, getRecipeCanonicalId, CATEGORY_FALLBACK_IMAGES, ValidatedFoodImage } from '../data/foodImageCatalog';
import { FOOD_EXPANSION } from '../data/foodExpansion';
import { EGYPTIAN_DISHES } from '../data/egyptianDishes';
import { getAllDetailedCategories } from '../data/food';
import { FoodRepository } from '../services/repositories/foodRepository';
import { StorageAdapter } from '../services/storageAdapter';
import { ShoppingItem } from '../types';
import { TAYYIBAT_ALLOWED, TAYYIBAT_FORBIDDEN, TAYYIBAT_MEAL_PLAN, TAYYIBAT_RECIPES, TAYYIBAT_RULES, TAYYIBAT_WARNING } from '../data/tayyibatSystem';

interface FoodSectionProps { onBack?: () => void; }
type Mode = 'home' | 'search' | 'favorites' | 'shopping' | 'category' | 'recipe' | 'tayyibat';
const FAV_KEY = 'smart_time_food_detailed_favorites_v4';

function buildCategories(): DetailedCategory[] {
  return getAllDetailedCategories(DETAILED_FOOD_CATEGORIES, FOOD_EXPANSION);
}

export { ValidatedFoodImage };

export default function FoodSection({ onBack }: FoodSectionProps) {
  const categories = useMemo(buildCategories, []);
  const [mode, setMode] = useState<Mode>('home');
  const [activeCategory, setActiveCategory] = useState<DetailedCategory | null>(null);
  const [activeRecipe, setActiveRecipe] = useState<DetailedRecipe | null>(null);
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => StorageAdapter.getItem<string[]>(FAV_KEY, []));
  const [shopping, setShopping] = useState<ShoppingItem[]>(() => FoodRepository.getShoppingList());

  const allRecipes = useMemo(() => (categories || []).flatMap(c => c?.recipes || []), [categories]);
  const favoriteRecipes = useMemo(() => (allRecipes || []).filter(r => r && favorites.includes(r.id)), [allRecipes, favorites]);

  const saveFavorites = (next:string[]) => { setFavorites(next); StorageAdapter.setItem(FAV_KEY, next); };
  const toggleFavorite = (id:string) => saveFavorites(favorites.includes(id) ? favorites.filter(x => x !== id) : [...favorites, id]);

  const refreshShopping = () => setShopping(FoodRepository.getShoppingList());
  const addRecipeToShopping = (recipe:DetailedRecipe) => {
    const existing = FoodRepository.getShoppingList();
    const newItems: ShoppingItem[] = (recipe.shopping || []).map((item, i) => ({
      id: `food-v4-${recipe.id}-${i}-${Date.now()}`,
      name: item.name,
      quantity: 1,
      unit: (item.amount || '') + (item.note ? ` — ${item.note}` : ''),
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
    const next = (shopping || []).filter(x => !x.isCompleted);
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
        <div className="min-w-0 flex-1"><h1 className="font-black text-lg truncate">{title}</h1><p className="text-[11px] text-slate-500">مكتبة أكل مصرية دقيقة بمطابقة الصور بدون تكرار</p></div>
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
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-4"><div className="text-5xl">📚</div><div><h2 className="text-2xl font-black">موسوعة الطعام</h2><p className="text-sm text-slate-500 mt-1">قسم منظم مع مطابقة تامة لصور الأصناف والتحقق من الهوية الفريدة لكل وصفة.</p></div></div></section>
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
  const recipesList = category?.recipes || [];
  const filtered=useMemo(()=>recipesList.filter(r=>`${r.title || ''} ${r.group || ''} ${(r.ingredients || []).map(i=>i?.name || '').join(' ')}`.includes(query.trim())),[recipesList,query]);
  const [open,setOpen]=useState<string|null>(null);
  const groups: string[] = useMemo(() => Array.from(new Set(recipesList.map(r => r.group).filter(Boolean))), [recipesList]);
  return <main className="max-w-4xl mx-auto p-4 pb-24 space-y-4">
    <SearchBox value={query} onChange={setQuery} placeholder="ابحث داخل القسم..."/>
    {groups.length > 1 && (
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setQuery('')}
          className={`rounded-2xl border px-3 py-2 text-xs font-black transition ${
            !query ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 hover:border-emerald-300'
          }`}
        >
          الكل ({recipesList.length})
        </button>
        {groups.map(g => (
          <button
            key={g}
            onClick={() => setQuery(query === g ? '' : g)}
            className={`rounded-2xl border px-3 py-2 text-xs font-black transition ${
              query === g ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-700 hover:border-emerald-300'
            }`}
          >
            {g} ({recipesList.filter(r => r.group === g).length})
          </button>
        ))}
      </div>
    )}
    <div className="rounded-2xl bg-white border p-3 text-xs text-slate-500">{filtered.length} طبق — اضغط على السطر لفتح المحتوى، واضغط مرة ثانية لإخفائه.</div>
    {groups.map(group=><section key={group} className="space-y-2"><h3 className="font-black px-1">{group}</h3>{filtered.filter(r=>r.group===group).map((recipe)=><AccordionRecipe key={recipe.id} recipe={recipe} open={open===recipe.id} onOpen={()=>setOpen(open===recipe.id?null:recipe.id)} favorite={favorites.includes(recipe.id)} onFavorite={()=>onFavorite(recipe.id)} onFull={()=>onRecipe(recipe)}/>)}</section>)}
    {!filtered.length && <Empty text="مش لاقي طبق بالمواصفات دي. جرّب اسم طبق أو مكوّن تاني."/>}
  </main>;
}

function AccordionRecipe({recipe,open,onOpen,favorite,onFavorite,onFull}:{key?: React.Key;recipe:DetailedRecipe;open:boolean;onOpen:()=>void;favorite:boolean;onFavorite:()=>void;onFull:()=>void}){
  return <article className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition">
    {/* 1. الصورة في الأعلى بدقة ووضوح مع التحقق من الهوية الفريدة والتبديل للصور الافتراضية */}
    <div className="bg-slate-50 p-2">
      <ValidatedFoodImage
        recipe={recipe}
        alt={recipe.title}
        allowVirtualToggle={true}
        className="w-full aspect-[16/10] sm:aspect-[16/9] object-cover rounded-[22px] bg-slate-100"
      />
    </div>

    {/* 2. اسم الأكلة بالكامل أسفل الصورة وبدون قطع */}
    <div className="p-3.5">
      <div className="flex items-start gap-2">
        <button
          onClick={onOpen}
          className="flex-1 min-w-0 text-right rounded-2xl px-2.5 py-2 hover:bg-slate-50 transition"
          aria-expanded={open}
          aria-label={`${open ? 'إخفاء' : 'إظهار'} مكونات ${recipe.title}`}
        >
          <div className="font-black text-base sm:text-lg leading-snug break-words whitespace-normal text-slate-900">
            {recipe.title}
          </div>
          <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap items-center gap-3">
            <span>⏱️ {(recipe.prepMinutes || 15) + (recipe.cookMinutes || 20)} د</span>
            <span>👥 {recipe.servings || 4} أفراد</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg">
              {open ? 'إخفاء المكونات' : 'عرض المكونات'}
            </span>
          </div>
        </button>
        <button
          onClick={e => {
            e.stopPropagation();
            onFavorite();
          }}
          className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center transition ${
            favorite ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50/50'
          }`}
          aria-label="المفضلة"
        >
          <Heart className={`w-5 h-5 ${favorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* 3. المكونات عند الضغط على اسم الأكلة */}
      {open && (
        <div className="mt-3 border-t border-slate-100 pt-3 space-y-3">
          <section className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5">
            <h4 className="font-black text-sm text-slate-900 mb-2.5 flex items-center gap-1.5">
              <span>🧺</span> المكونات الأساسية ({recipe.ingredients?.length || 0})
            </h4>
            <ul className="space-y-1.5 text-sm leading-relaxed text-slate-700">
              {(recipe.ingredients || []).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span className="break-words">
                    {item.amount ? <span className="font-bold text-slate-900">{item.amount} </span> : ''}
                    {item.name}
                    {item.note ? <span className="text-slate-500 text-xs"> ({item.note})</span> : ''}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {recipe.tips && recipe.tips.length > 0 && (
            <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200 p-3 text-xs text-emerald-950 leading-relaxed font-medium">
              💡 <b>سر الصنعة:</b> {recipe.tips[0]}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onFull}
              className="flex-1 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white py-3 text-xs font-black transition text-center shadow-sm"
            >
              عرض الوصفة والطهي بالكامل
            </button>
          </div>
        </div>
      )}
    </div>
  </article>;
}

function SearchView({query,setQuery,recipes,favorites,onFavorite,onRecipe}:{query:string;setQuery:(v:string)=>void;recipes:DetailedRecipe[];favorites:string[];onFavorite:(id:string)=>void;onRecipe:(r:DetailedRecipe)=>void}){
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter(r =>
      `${r.title || ''} ${r.category || ''} ${r.group || ''} ${(r.ingredients || []).map(i => i?.name || '').join(' ')}`
        .toLowerCase()
        .includes(q)
    );
  }, [recipes, query]);

  return (
    <main className="max-w-4xl mx-auto p-4 pb-24 space-y-4">
      <SearchBox value={query} onChange={setQuery} placeholder="ابحث باسم الأكلة، المكونات، أو القسم..." />
      <div className="rounded-2xl bg-white border border-slate-200 p-3 text-xs text-slate-500 flex justify-between items-center">
        <span>{query ? `نتائج البحث: ${filtered.length} طبق` : `كل المكتبة: ${filtered.length} وصفة`}</span>
        <span className="text-emerald-700 font-bold">بمطابقة صور فريدة</span>
      </div>
      <div className="space-y-3">
        {filtered.map(r => (
          <AccordionSearch
            key={r.id}
            recipe={r}
            favorite={favorites.includes(r.id)}
            onFavorite={() => onFavorite(r.id)}
            onRecipe={() => onRecipe(r)}
          />
        ))}
      </div>
      {!filtered.length && <Empty text="لا توجد نتائج تطابق بحثك. جرّب كتابة كلمة أخرى." />}
    </main>
  );
}

function AccordionSearch({recipe,favorite,onFavorite,onRecipe}:{key?: React.Key;recipe:DetailedRecipe;favorite:boolean;onFavorite:()=>void;onRecipe:()=>void}){
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 flex items-center gap-3.5 shadow-sm hover:shadow-md transition">
      <ValidatedFoodImage
        recipe={recipe}
        alt={recipe.title}
        className="w-20 h-16 sm:w-24 sm:h-20 rounded-xl object-cover bg-slate-100 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="font-black text-sm sm:text-base leading-snug break-words text-slate-900">{recipe.title}</div>
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
          <span className="text-emerald-700 font-semibold">{recipe.category || 'أكلات مصرية'}</span>
          <span>•</span>
          <span>{recipe.group}</span>
        </div>
      </div>
      <button
        onClick={onFavorite}
        className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition ${
          favorite ? 'text-rose-600 bg-rose-50' : 'text-slate-300 hover:text-rose-500 bg-slate-50'
        }`}
        aria-label="المفضلة"
      >
        <Heart className={`w-5 h-5 ${favorite ? 'fill-current' : ''}`} />
      </button>
      <button
        onClick={onRecipe}
        className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 px-3.5 py-2 text-xs font-black shrink-0 transition"
      >
        فتح الوصفة
      </button>
    </div>
  );
}

function FavoritesView({recipes,favorites,onFavorite,onRecipe,onGoSearch}:{recipes:DetailedRecipe[];favorites:string[];onFavorite:(id:string)=>void;onRecipe:(r:DetailedRecipe)=>void;onGoSearch:()=>void}){
  return (
    <main className="max-w-4xl mx-auto p-4 pb-24 space-y-4">
      {!(recipes || []).length ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
          <Heart className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <h2 className="font-black text-lg text-slate-900">المفضلة فارغة</h2>
          <p className="text-sm text-slate-500 mt-1">اضغط على أيقونة ❤️ بجوار أي صنف لحفظه والوصول إليه بسرعة.</p>
          <button onClick={onGoSearch} className="mt-5 rounded-2xl bg-slate-900 text-white px-6 py-3 font-black text-sm">
            تصفح الوصفات والبحث
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {(recipes || []).map(r => (
            <AccordionSearch
              key={r.id}
              recipe={r}
              favorite={favorites.includes(r.id)}
              onFavorite={() => onFavorite(r.id)}
              onRecipe={() => onRecipe(r)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function Info({label,value}:{label:string;value:string}){
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 text-center">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-black text-sm mt-0.5 text-slate-900">{value}</div>
    </div>
  );
}

function RecipeDetail({recipe,favorite,onFavorite,onShopping}:{recipe:DetailedRecipe;favorite:boolean;onFavorite:()=>void;onShopping:()=>void}){
  return (
    <main className="max-w-4xl mx-auto p-4 pb-24 space-y-4">
      <article className="rounded-[28px] overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-100 relative">
          <ValidatedFoodImage
            recipe={recipe}
            alt={recipe.title}
            allowVirtualToggle={true}
            className="w-full max-h-[420px] object-cover"
          />
        </div>
        <div className="p-5 sm:p-6 space-y-6">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                {recipe.category || 'أكلات مصرية'} • {recipe.group}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-2 leading-tight break-words text-slate-900">
                {recipe.title}
              </h2>
            </div>
            <button
              onClick={onFavorite}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition shrink-0 ${
                favorite ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500 hover:text-rose-500'
              }`}
              aria-label="حفظ في المفضلة"
            >
              <Heart className={`w-6 h-6 ${favorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Info label="التحضير" value={`${recipe.prepMinutes || 15} د`} />
            <Info label="الطهي" value={`${recipe.cookMinutes || 20} د`} />
            <Info label="يكفي" value={`${recipe.servings || 4} أفراد`} />
          </div>

          {/* كميات الشراء والمكونات */}
          <section>
            <h3 className="font-black text-lg mb-3 flex items-center gap-2 text-slate-900">
              <span>🛒</span> قائمة المكونات ومقادير الشراء
            </h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {(recipe.shopping && recipe.shopping.length > 0 ? recipe.shopping : (recipe.ingredients || []).map(ing => ({ name: ing.name, amount: ing.amount || '', note: ing.note }))).map((x, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex justify-between items-center gap-3">
                  <span className="font-bold text-slate-900 text-sm">{x.name}</span>
                  <span className="text-xs font-medium text-slate-600 shrink-0">{x.amount}{x.note ? ` (${x.note})` : ''}</span>
                </div>
              ))}
            </div>
          </section>

          {/* التتبيلة إن وجدت */}
          {recipe.marinade && recipe.marinade.length > 0 && (
            <section>
              <h3 className="font-black text-lg mb-3 flex items-center gap-2 text-slate-900">
                <span>🥣</span> التتبيلة / خلطة التأسيس
              </h3>
              <ul className="space-y-2">
                {recipe.marinade.map((x, i) => (
                  <li key={i} className="rounded-2xl bg-amber-50/80 border border-amber-200 p-3 text-sm leading-relaxed text-amber-950 font-medium">
                    {x}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* طريقة التحضير والطهي بالتفصيل */}
          <section>
            <h3 className="font-black text-lg mb-3 flex items-center gap-2 text-slate-900">
              <span>🥘</span> طريقة التحضير والطهي خطوة بخطوة
            </h3>
            <ol className="space-y-3">
              {(recipe.cooking && recipe.cooking.length > 0 ? recipe.cooking : ['اتبع إرشادات التحضير القياسية للمكونات بدقة.']).map((stepText, i) => (
                <li key={i} className="flex items-start gap-3 rounded-2xl bg-white border border-slate-200 p-3.5">
                  <span className="w-7 h-7 rounded-full bg-emerald-600 text-white shrink-0 flex items-center justify-center text-xs font-black">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-7 text-slate-800 break-words flex-1 font-medium">{stepText}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* أسرار وتكات الشيف */}
          {recipe.tips && recipe.tips.length > 0 && (
            <section>
              <h3 className="font-black text-lg mb-3 flex items-center gap-2 text-slate-900">
                <span>💡</span> أسرار وتكات الطبخ
              </h3>
              <div className="space-y-2">
                {recipe.tips.map((tip, i) => (
                  <div key={i} className="rounded-2xl bg-blue-50/80 border border-blue-200 p-3 text-sm leading-relaxed text-blue-950 font-medium">
                    {tip}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* إضافة لقائمة المشتريات */}
          <button
            onClick={onShopping}
            className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white py-4 font-black flex items-center justify-center gap-2 shadow-sm transition text-base"
          >
            <ShoppingCart className="w-5 h-5" />
            أضف مقادير هذا الطبق إلى قائمة المشتريات
          </button>
        </div>
      </article>
    </main>
  );
}

function ShoppingView({items,onToggle,onDelete,onClearCompleted}:{items:ShoppingItem[];onToggle:(id:string)=>void;onDelete:(id:string)=>void;onClearCompleted:()=>void}){return <main className="max-w-3xl mx-auto p-4 pb-24 space-y-4"><div className="rounded-3xl border bg-white p-5"><div className="flex items-center gap-3"><ShoppingCart className="w-7 h-7 text-emerald-700"/><div className="flex-1"><h2 className="text-xl font-black">قائمة المشتريات</h2><p className="text-xs text-slate-500">أي وصفة تضيفها ستظهر هنا فورًا.</p></div>{items.some(x=>x.isCompleted)&&<button onClick={onClearCompleted} className="text-xs font-black text-rose-600">حذف المكتمل</button>}</div></div>{!items.length?<Empty text="القائمة فاضية حاليًا. افتح أي وصفة واضغط أضف للمشتريات."/>:<div className="space-y-2">{items.map(item=><div key={item.id} className={`rounded-2xl border bg-white p-3 flex items-center gap-3 ${item.isCompleted?'opacity-60':''}`}><button onClick={()=>onToggle(item.id)} className={`w-9 h-9 rounded-xl border flex items-center justify-center ${item.isCompleted?'bg-emerald-600 text-white':'bg-white'}`}>{item.isCompleted?<Check className="w-5"/>:<span/>}</button><div className="flex-1"><div className={`font-bold ${item.isCompleted?'line-through':''}`}>{item.name}</div><div className="text-xs text-slate-500">{item.unit} {item.category?`• ${item.category}`:''}</div></div><button onClick={()=>onDelete(item.id)} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-5"/></button></div>)}</div>}</main>}
function SearchBox({value,onChange,placeholder}:{value:string;onChange:(v:string)=>void;placeholder:string}){return <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm"><Search className="w-5 text-slate-400 mt-1 shrink-0"/><input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="w-full outline-none text-sm bg-transparent"/><button onClick={()=>onChange('')} className="text-slate-300 hover:text-slate-500"><X className="w-4"/></button></div>}
function Empty({text}:{text:string}){return <div className="rounded-3xl border bg-white p-10 text-center text-slate-500">{text}</div>}

function TayyibatView(){
  const [tab,setTab]=useState<'overview'|'allowed'|'forbidden'|'recipes'|'plan'>('overview');
  const tabs=[['overview','نظرة عامة'],['allowed','المسموحات'],['forbidden','الممنوعات'],['recipes','الوصفات'],['plan','الخطة الأسبوعية']] as const;
  return <main className="max-w-4xl mx-auto p-4 pb-24 space-y-4">
    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
      <h2 className="font-black text-lg text-emerald-950">🌿 نظام الطيبات 2026</h2>
      <p className="text-sm text-emerald-900 mt-1">المحتوى منظم في تبويبات واضحة مع المسموحات والممنوعات والوصفات العملية.</p>
    </div>
    <div className="flex gap-2 overflow-x-auto">
      {tabs.map(([id,t])=><button key={id} onClick={()=>setTab(id)} className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-black border ${tab===id?'bg-slate-900 text-white':'bg-white'}`}>{t}</button>)}
    </div>
    {tab==='overview'&&<div className="space-y-3">{TAYYIBAT_RULES.map(([name,desc],i)=><div key={i} className="rounded-2xl border bg-white p-4 text-sm"><b>{name}</b><div className="text-slate-600 mt-1">{desc}</div></div>)}<div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm">{TAYYIBAT_WARNING}</div></div>}
    {tab==='allowed'&&<div className="grid sm:grid-cols-3 gap-3">{(['يومي','أسبوعي','عرضي'] as const).map(f=><div key={f} className="rounded-3xl border bg-white p-4"><h3 className="font-black mb-3">{f}</h3>{TAYYIBAT_ALLOWED.filter(x=>x.frequency===f).map(x=><div key={x.name} className="text-sm py-1.5 flex gap-2"><CheckCircle2 className="w-4 text-emerald-600 shrink-0"/>{x.name}</div>)}</div>)}</div>}
    {tab==='forbidden'&&<div className="space-y-2">{TAYYIBAT_FORBIDDEN.map(([n,r])=><div key={n} className="rounded-2xl border bg-white p-4"><b>{n}</b><div className="text-sm text-slate-500 mt-1">{r}</div></div>)}</div>}
    {tab==='recipes'&&<div className="space-y-4">
      {TAYYIBAT_RECIPES.map(x=><div key={x.id} className="rounded-3xl border bg-white p-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-4">
          <ValidatedFoodImage
            recipe={{ id: x.id, title: x.title, category: 'tayyibat', image: x.imageUrl }}
            alt={x.title}
            className="w-full sm:w-48 h-36 object-cover rounded-2xl bg-slate-100"
          />
          <div className="flex-1">
            <b className="text-base">{x.title}</b>
            <div className="text-xs text-emerald-700 font-bold mt-0.5">{x.type} {x.sourceNote ? `• ${x.sourceNote}` : ''}</div>
            <div className="text-sm mt-2 text-slate-700 font-semibold">{x.ingredients.join(' • ')}</div>
            <ol className="mt-2 text-sm text-slate-600 list-decimal pr-5 space-y-1">{x.steps.map((s,i)=><li key={i}>{s}</li>)}</ol>
          </div>
        </div>
      </div>)}
    </div>}
    {tab==='plan'&&<div className="space-y-2">{TAYYIBAT_MEAL_PLAN.map(([day,breakfast,lunch,dinner],i)=><div key={i} className="rounded-2xl border bg-white p-4"><b>{day}</b><div className="text-sm mt-2"><div>الإفطار: {breakfast}</div><div>الغداء: {lunch}</div><div>العشاء: {dinner}</div></div></div>)}</div>}
  </main>;
}
