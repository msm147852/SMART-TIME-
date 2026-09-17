import React, { useMemo, useState, useEffect } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChefHat,
  Clock,
  Heart,
  Search,
  ShoppingCart,
  Sparkles,
  UtensilsCrossed,
  Move,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  GripVertical,
} from 'lucide-react';
import { FoodMainSection, FoodSubcategory, DietSystem, Language, Recipe, ShoppingItem } from '../types';
import { FoodRepository } from '../services';
import { DETAILED_FOOD_CATEGORIES, DetailedCategory, DetailedRecipe } from '../data/detailedFoodLibrary';
import { foodImageFor, ValidatedFoodImage } from '../data/foodImageCatalog';

interface FoodViewProps {
  language: Language;
  recipes: Recipe[];
  shoppingList: ShoppingItem[];
  onUpdateRecipes: (recipes: Recipe[]) => void;
  onUpdateShoppingList: (items: ShoppingItem[]) => void;
}

type Screen = 'home' | 'section' | 'recipes' | 'recipe' | 'shopping' | 'detailed-list' | 'detailed-recipe';

const initialMainCards: { id: FoodMainSection; title: string; subtitle: string; emoji: string }[] = [
  { id: 'eastern', title: 'الأكلات الشرقية', subtitle: 'أكلات مصرية وشرقية مرتبة حسب نوع الطبق', emoji: '🍲' },
  { id: 'eastern_desserts', title: 'الحلويات الشرقية', subtitle: 'حلويات ومعجنات حلوة ووصفات تقليدية', emoji: '🍰' },
  { id: 'diet', title: 'الدايت', subtitle: 'كيتو، نظام الطيبات، والأنظمة المشاعة', emoji: '🥗' },
];

const initialSubCards: { id: FoodSubcategory; title: string; emoji: string }[] = [
  { id: 'starches', title: 'نشويات', emoji: '🍚' },
  { id: 'pastries', title: 'معجنات', emoji: '🥐' },
  { id: 'desserts', title: 'حلويات', emoji: '🍮' },
];

const initialDietCards: { id: DietSystem; title: string; emoji: string }[] = [
  { id: 'keto', title: 'كيتو دايت', emoji: '🥩' },
  { id: 'tayyibat', title: 'نظام الطيبات', emoji: '🌿' },
  { id: 'common', title: 'كل الأنظمة المشاعة', emoji: '🍽️' },
];

const fallbackImage = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80';

export const FoodView: React.FC<FoodViewProps> = ({
  language,
  recipes,
  shoppingList,
  onUpdateRecipes,
  onUpdateShoppingList,
}) => {
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
  const [detailedFavorites, setDetailedFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('smart-time-detailed-food-favorites') || '[]');
    } catch {
      return [];
    }
  });

  // Reordering mode state
  const [isReorderMode, setIsReorderMode] = useState(false);

  // Category order persistence
  const [categoryOrder, setCategoryOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('smart_time_food_categories_order');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DETAILED_FOOD_CATEGORIES.map((c) => c.id);
  });

  useEffect(() => {
    try {
      localStorage.setItem('smart_time_food_categories_order', JSON.stringify(categoryOrder));
    } catch {}
  }, [categoryOrder]);

  const orderedCategories = useMemo(() => {
    const list = [...DETAILED_FOOD_CATEGORIES];
    list.sort((a, b) => {
      const idxA = categoryOrder.indexOf(a.id);
      const idxB = categoryOrder.indexOf(b.id);
      return (idxA >= 0 ? idxA : 999) - (idxB >= 0 ? idxB : 999);
    });
    return list;
  }, [categoryOrder]);

  const handleMoveCategory = (index: number, direction: 'up' | 'down', e?: React.MouseEvent) => {
    e?.stopPropagation();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedCategories.length) return;

    const newOrder = orderedCategories.map((c) => c.id);
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    setCategoryOrder(newOrder);

    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      try {
        window.navigator.vibrate(10);
      } catch {}
    }
  };

  const handleResetCategoryOrder = () => {
    setCategoryOrder(DETAILED_FOOD_CATEGORIES.map((c) => c.id));
    setIsReorderMode(false);
  };

  const ensureCatalog = useMemo(() => recipes, [recipes]);

  const visibleRecipes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ensureCatalog.filter((r) => {
      const mainOk = !section || r.mainSection === section;
      const subOk = !subcategory || r.subcategory === subcategory;
      const dietOk = !diet || r.dietSystems?.includes(diet);
      const text = `${r.title} ${r.tags?.join(' ') || ''} ${r.ingredients.map((i) => i.name).join(' ')}`.toLowerCase();
      return mainOk && subOk && dietOk && (!q || text.includes(q));
    });
  }, [ensureCatalog, section, subcategory, diet, search]);

  const saveRecipes = (next: Recipe[]) => {
    onUpdateRecipes(next);
    FoodRepository.saveRecipes(next);
  };

  const toggleFavorite = (id: string) =>
    saveRecipes(recipes.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r)));

  const goBack = () => {
    if (screen === 'detailed-recipe') return setScreen('detailed-list');
    if (screen === 'detailed-list') {
      setDetailedCategory(null);
      return setScreen('home');
    }
    if (screen === 'recipe') return setScreen('recipes');
    if (screen === 'recipes') return setScreen('section');
    if (screen === 'section') {
      setSection(null);
      setSubcategory(null);
      setDiet(null);
      return setScreen('home');
    }
    setScreen('home');
  };

  const openDetailedCategory = (cat: DetailedCategory) => {
    if (isReorderMode) return;
    if (cat.id === 'tayyibat') {
      setSection('diet');
      setSubcategory(null);
      setDiet('tayyibat');
      setSearch('');
      setScreen('recipes');
      return;
    }
    setDetailedCategory(cat);
    setSelectedDetailedRecipe(null);
    setSearch('');
    setScreen('detailed-list');
  };

  const openDetailedRecipe = (recipe: DetailedRecipe) => {
    setSelectedDetailedRecipe(recipe);
    setScreen('detailed-recipe');
  };

  const toggleDetailedFavorite = (id: string) => {
    setDetailedFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem('smart-time-detailed-food-favorites', JSON.stringify(next));
      return next;
    });
  };

  const openSection = (id: FoodMainSection) => {
    setSection(id);
    setSubcategory(null);
    setDiet(null);
    setScreen('section');
  };

  const openRecipes = (sub?: FoodSubcategory, dietSystem?: DietSystem) => {
    setSubcategory(sub || null);
    setDiet(dietSystem || null);
    setSearch('');
    setScreen('recipes');
  };

  const addRecipeIngredientsToShopping = (recipe: DetailedRecipe) => {
    const nextItems = recipe.shopping.map((item, index) => ({
      id: `food_recipe_${recipe.id}_${Date.now()}_${index}`,
      name: item.name,
      quantity: 1,
      unit: item.amount,
      isCompleted: false,
      category: recipe.title,
      addedFromRecipeId: recipe.id,
    }));
    const next = [...nextItems, ...shoppingList];
    onUpdateShoppingList(next);
    FoodRepository.saveShoppingList(next);
  };

  const addShopping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shoppingText.trim()) return;
    const next = [
      {
        id: `food_shop_${Date.now()}`,
        name: shoppingText.trim(),
        quantity: 1,
        unit: 'حبة',
        isCompleted: false,
        category: 'مكونات وصفات',
      },
      ...shoppingList,
    ];
    onUpdateShoppingList(next);
    FoodRepository.saveShoppingList(next);
    setShoppingText('');
  };

  if (screen === 'detailed-recipe' && selectedDetailedRecipe) {
    return (
      <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
        <Header title={selectedDetailedRecipe.title} onBack={goBack} icon={<ChefHat />} />
        <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <ValidatedFoodImage
            recipe={selectedDetailedRecipe}
            className="h-72 w-full object-cover"
            alt={selectedDetailedRecipe.title}
          />
          <div className="p-5 space-y-6">
            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={() => toggleDetailedFavorite(selectedDetailedRecipe.id)}
                className={`rounded-full px-4 py-2 text-xs font-black border transition ${
                  detailedFavorites.includes(selectedDetailedRecipe.id)
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                {detailedFavorites.includes(selectedDetailedRecipe.id) ? '♥ في المفضلة' : '♡ إضافة للمفضلة'}
              </button>
              <span className="rounded-full bg-orange-50 dark:bg-orange-950/40 px-3 py-1 text-xs font-black text-orange-700 dark:text-orange-300">
                {selectedDetailedRecipe.group}
              </span>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                {selectedDetailedRecipe.servings} أفراد
              </span>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                تحضير {selectedDetailedRecipe.prepMinutes} د
              </span>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                طهي {selectedDetailedRecipe.cookMinutes} د
              </span>
            </div>

            <section>
              <h3 className="font-black text-xl mb-3 text-slate-900 dark:text-white">🛒 كمية الشراء</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedDetailedRecipe.shopping.map((x, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 flex items-start justify-between gap-3"
                  >
                    <div>
                      <b className="text-slate-900 dark:text-white">{x.name}</b>
                      {x.note && <div className="text-xs text-slate-500 mt-1">{x.note}</div>}
                    </div>
                    <span className="font-black text-orange-700 dark:text-orange-400 whitespace-nowrap">{x.amount}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addRecipeIngredientsToShopping(selectedDetailedRecipe)}
                className="mt-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 text-sm font-black shadow-sm active:scale-95 transition"
              >
                إضافة مكونات الوصفة لقائمة المشتريات
              </button>
            </section>

            <section>
              <h3 className="font-black text-xl mb-3 text-slate-900 dark:text-white">🥣 المكونات</h3>
              <div className="space-y-2">
                {selectedDetailedRecipe.ingredients.map((x, i) => (
                  <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
                    <div className="font-black text-slate-900 dark:text-white">{x.name}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      الكمية: {x.amount}
                      {x.note ? ` — ${x.note}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {selectedDetailedRecipe.marinade && (
              <section>
                <h3 className="font-black text-xl mb-3 text-slate-900 dark:text-white">🧂 التتبيلة بالتفصيل</h3>
                <ol className="space-y-2">
                  {selectedDetailedRecipe.marinade.map((x, i) => (
                    <li
                      key={i}
                      className="rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900 p-3 text-sm text-slate-800 dark:text-slate-200"
                    >
                      <b>{i + 1}.</b> {x}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <section>
              <h3 className="font-black text-xl mb-3 text-slate-900 dark:text-white">👨‍🍳 طريقة التحضير والطهي</h3>
              <ol className="space-y-3">
                {selectedDetailedRecipe.cooking.map((x, i) => (
                  <li
                    key={i}
                    className="flex gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-slate-800 dark:text-slate-200"
                  >
                    <span className="w-8 h-8 shrink-0 rounded-full bg-orange-500 text-white flex items-center justify-center font-black">
                      {i + 1}
                    </span>
                    <span className="pt-1 text-sm leading-7">{x}</span>
                  </li>
                ))}
              </ol>
            </section>

            {selectedDetailedRecipe.tips && (
              <section>
                <h3 className="font-black text-xl mb-3 text-slate-900 dark:text-white">💡 أسرار النجاح</h3>
                <ul className="space-y-2">
                  {selectedDetailedRecipe.tips.map((x, i) => (
                    <li
                      key={i}
                      className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 p-3 text-sm text-emerald-900 dark:text-emerald-300"
                    >
                      ✓ {x}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'detailed-list' && detailedCategory) {
    return (
      <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
        <Header title={detailedCategory.title} onBack={goBack} icon={<UtensilsCrossed />} />
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex gap-3 items-center">
            <span className="text-5xl">{detailedCategory.emoji}</span>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">{detailedCategory.title}</h2>
              <p className="text-sm text-slate-500 mt-1">{detailedCategory.subtitle}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 rounded-2xl bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800">
          <Search className="m-2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن وصفة أو مكون..."
            className="w-full outline-none bg-transparent text-slate-900 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {detailedCategory.recipes
            .filter(
              (x) =>
                !search.trim() ||
                `${x.title} ${x.group} ${x.ingredients.map((i) => i.name).join(' ')}`.includes(search.trim())
            )
            .map((recipe) => (
              <DetailedRecipeCard
                key={recipe.id}
                recipe={recipe}
                isFavorite={detailedFavorites.includes(recipe.id)}
                onFavorite={() => toggleDetailedFavorite(recipe.id)}
                onOpen={() => openDetailedRecipe(recipe)}
              />
            ))}
        </div>
      </div>
    );
  }

  if (screen === 'recipe' && selectedRecipe) {
    return (
      <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
        <Header title={selectedRecipe.title} onBack={goBack} />
        <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <ValidatedFoodImage
            recipe={selectedRecipe}
            className="h-64 w-full object-cover"
            alt={selectedRecipe.title}
          />
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {(selectedRecipe.tags || []).map((t) => (
                  <span key={t} className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                    #{t}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => toggleFavorite(selectedRecipe.id)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300"
              >
                <Heart className={selectedRecipe.isFavorite ? 'fill-current text-rose-500' : ''} />
              </button>
            </div>
            {selectedRecipe.notes && (
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 p-4 text-sm text-amber-900 dark:text-amber-200">
                {selectedRecipe.notes}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <Info label="التحضير" value={`${selectedRecipe.prepTimeMinutes} د`} />
              <Info label="الطهي" value={`${selectedRecipe.cookTimeMinutes} د`} />
              <Info label="الحصص" value={String(selectedRecipe.servings || '—')} />
              <Info
                label="التصنيف"
                value={
                  selectedRecipe.subcategory === 'starches'
                    ? 'نشويات'
                    : selectedRecipe.subcategory === 'pastries'
                    ? 'معجنات'
                    : 'حلويات'
                }
              />
            </div>
            <div>
              <h3 className="font-black text-lg mb-2 text-slate-900 dark:text-white">المكونات</h3>
              {selectedRecipe.ingredients.length ? (
                <ul className="space-y-2">
                  {selectedRecipe.ingredients.map((i, n) => (
                    <li key={n} className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-800 dark:text-slate-200">
                      {i.name} — {i.amount} {i.unit}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">
                  المصدر المرفوع يعرض هذه الوصفة كملخص؛ سيتم استكمال التفاصيل عند إضافة بيانات المصدر الكاملة.
                </p>
              )}
            </div>
            <div>
              <h3 className="font-black text-lg mb-2 text-slate-900 dark:text-white">طريقة التحضير / الملخص</h3>
              <ol className="space-y-2 list-decimal pr-5">
                {selectedRecipe.steps.map((s, n) => (
                  <li key={n} className="text-sm text-slate-700 dark:text-slate-300">
                    {s}
                  </li>
                ))}
              </ol>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 text-xs text-slate-500">
              المصدر: {selectedRecipe.source || 'قاعدة SMART TIME'}
              {selectedRecipe.sourcePage ? ` — صفحة ${selectedRecipe.sourcePage}` : ''}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'shopping') {
    return (
      <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
        <Header title="قائمة المشتريات" onBack={goBack} icon={<ShoppingCart />} />
        <form onSubmit={addShopping} className="flex gap-2">
          <input
            value={shoppingText}
            onChange={(e) => setShoppingText(e.target.value)}
            placeholder="أضف مكوناً للقائمة"
            className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-slate-900 dark:text-white"
          />
          <button className="rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 font-bold">
            إضافة
          </button>
        </form>
        <div className="space-y-2">
          {shoppingList.map((i) => (
            <div
              key={i.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3"
            >
              <input
                type="checkbox"
                checked={i.isCompleted}
                onChange={() => {
                  const n = shoppingList.map((x) => (x.id === i.id ? { ...x, isCompleted: !x.isCompleted } : x));
                  onUpdateShoppingList(n);
                  FoodRepository.saveShoppingList(n);
                }}
              />
              <span className={i.isCompleted ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}>
                {i.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (screen === 'recipes') {
    return (
      <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
        <Header
          title={
            diet
              ? initialDietCards.find((x) => x.id === diet)?.title || ''
              : subcategory
              ? initialSubCards.find((x) => x.id === subcategory)?.title || ''
              : 'الوصفات'
          }
          onBack={goBack}
        />
        <div className="flex gap-2 rounded-2xl bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800">
          <Search className="m-2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن وصفة أو مكون"
            className="w-full outline-none bg-transparent text-slate-900 dark:text-white"
          />
        </div>
        {diet === 'tayyibat' && (
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 p-4 text-sm text-emerald-900 dark:text-emerald-200">
            تصنيف الطيبات هنا مبني على قائمة المسموحات/الممنوعات في المصدر، وليس حكماً طبياً مستقلاً.
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleRecipes.map((r) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              onOpen={() => {
                setSelectedRecipe(r);
                setScreen('recipe');
              }}
              onFavorite={() => toggleFavorite(r.id)}
            />
          ))}
        </div>
        {!visibleRecipes.length && (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center text-slate-500">
            لا توجد وصفات بهذا التصنيف حالياً.
          </div>
        )}
      </div>
    );
  }

  if (screen === 'section') {
    return (
      <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
        <Header title={initialMainCards.find((x) => x.id === section)?.title || 'الطعام'} onBack={goBack} />
        {section === 'diet' ? (
          <>
            <SectionTitle text="اختار النظام" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {initialDietCards.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openRecipes(undefined, c.id)}
                  className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center shadow-sm hover:shadow-md transition"
                >
                  <div className="text-4xl mb-3">{c.emoji}</div>
                  <div className="font-black text-slate-900 dark:text-white">{c.title}</div>
                  <div className="text-xs text-slate-500 mt-1">نشويات • معجنات • حلويات</div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <SectionTitle text="اختار نوع الوصفة" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {initialSubCards.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openRecipes(c.id)}
                  className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center shadow-sm hover:shadow-md transition"
                >
                  <div className="text-4xl mb-3">{c.emoji}</div>
                  <div className="font-black text-slate-900 dark:text-white">{c.title}</div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Header with Shopping & Reorder Buttons */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-orange-50 dark:bg-orange-950/40 p-3 text-2xl">🍽️</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">قسم الطعام</h1>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                مكتبة منظمة: محاشي • مشويات • مشروبات • عصائر • مخبوزات • سلطات، بالإضافة إلى الأكلات المصرية والطيبات.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsReorderMode(!isReorderMode)}
              className={`rounded-2xl border px-3.5 py-2.5 text-xs font-black flex items-center gap-1.5 transition ${
                isReorderMode
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
              title={isAr ? 'ترتيب البطاقات' : 'Reorder categories'}
            >
              <Move className="w-4 h-4" />
              <span>{isReorderMode ? (isAr ? 'تم ✓' : 'Done') : isAr ? 'ترتيب البطاقات' : 'Reorder'}</span>
            </button>
            {isReorderMode && (
              <button
                type="button"
                onClick={handleResetCategoryOrder}
                className="rounded-2xl p-2.5 text-xs font-black bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200"
                title={isAr ? 'الترتيب الافتراضي' : 'Reset default'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setScreen('shopping')}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200"
            >
              <ShoppingCart className="w-4" />
              <span>المشتريات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Favorites */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="w-2 h-7 rounded-full bg-rose-500" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white">⭐ المفضلة</h2>
        </div>
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          {detailedFavorites.length ? (
            <div className="flex flex-wrap gap-2">
              {Array.from(
                new Map(
                  DETAILED_FOOD_CATEGORIES.flatMap((c) => c.recipes)
                    .filter((r) => detailedFavorites.includes(r.id))
                    .map((r) => [r.id, r])
                ).values()
              ).map((r) => (
                <button
                  key={r.id}
                  onClick={() => openDetailedRecipe(r)}
                  className="rounded-2xl border border-rose-100 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-sm font-black text-rose-700 dark:text-rose-300 transition hover:scale-105"
                >
                  ♥ {r.title}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">لم تضف أطباقًا للمفضلة بعد. اضغط ♡ على أي وصفة وستظهر هنا.</p>
          )}
        </div>
      </section>

      {/* Reorder Mode Helper Hint */}
      {isReorderMode && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-2xl flex items-center justify-between gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-amber-600" />
            <span>{isAr ? 'استخدم أزرار الأسهم لتحريك وإعادة ترتيب أقسام الطعام.' : 'Use arrow buttons to reorder categories.'}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsReorderMode(false)}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black text-xs shrink-0"
          >
            {isAr ? 'حفظ والانتهاء ✓' : 'Done'}
          </button>
        </div>
      )}

      {/* Food Categories with Reordering Support */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-7 rounded-full bg-orange-500" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white">🍽️ مكتبة الطعام الرئيسية</h2>
          </div>
          <span className="text-xs text-slate-400 font-bold">{orderedCategories.length} أقسام</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orderedCategories.map((c, idx) => (
            <div
              key={c.id}
              onClick={() => openDetailedCategory(c)}
              className={`overflow-hidden rounded-3xl border bg-white dark:bg-slate-900 text-right shadow-sm transition relative ${
                isReorderMode
                  ? 'border-amber-400 ring-1 ring-amber-400'
                  : 'border-slate-200 dark:border-slate-800 hover:shadow-md cursor-pointer'
              }`}
            >
              <div className="relative">
                <img
                  src={c.recipes[0] ? foodImageFor(c.recipes[0]) : fallbackImage}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = fallbackImage;
                  }}
                  className="h-44 w-full object-cover"
                  alt=""
                />
                {isReorderMode && (
                  <div className="absolute top-3 left-3 bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-xl shadow-md">
                    #{idx + 1}
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{c.emoji}</span>
                    <div>
                      <h3 className="font-black text-lg text-slate-900 dark:text-white">{c.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">{c.recipes.length} وصفة تفصيلية</p>
                    </div>
                  </div>

                  {isReorderMode && (
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => handleMoveCategory(idx, 'up', e)}
                        className={`p-1.5 rounded-lg text-xs font-black ${
                          idx === 0
                            ? 'text-slate-300 dark:text-slate-700'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                        title="تحريك لأعلى"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === orderedCategories.length - 1}
                        onClick={(e) => handleMoveCategory(idx, 'down', e)}
                        className={`p-1.5 rounded-lg text-xs font-black ${
                          idx === orderedCategories.length - 1
                            ? 'text-slate-300 dark:text-slate-700'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                        title="تحريك لأسفل"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-sm text-slate-500 leading-6 line-clamp-2">{c.subtitle}</p>
                {!isReorderMode && <div className="mt-4 text-xs font-black text-orange-600">فتح القسم ←</div>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Diets and other cards */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="w-2 h-7 rounded-full bg-emerald-500" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white">الأقسام الغذائية والأنظمة</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {initialMainCards.map((c) => (
            <button
              key={c.id}
              onClick={() => openSection(c.id)}
              className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-right shadow-sm hover:shadow-md transition"
            >
              <div className="text-5xl mb-4">{c.emoji}</div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{c.title}</h2>
              <p className="mt-2 text-sm text-slate-500">{c.subtitle}</p>
              <div className="mt-5 flex items-center gap-2 text-xs font-bold text-orange-600">
                فتح القسم <ArrowRight className="w-4" />
              </div>
            </button>
          ))}
        </div>
      </section>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-5">
        <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
          <Sparkles className="w-5" /> تنظيم قاعدة الطعام
        </div>
        <p className="text-sm text-slate-500 mt-2 leading-6">
          كل وصفة تفصيلية تحتوي على صورة، كمية شراء، مكونات، تتبيلة عند الحاجة، خطوات تحضير وطهي، ونصائح. ويمكن إضافة
          مكونات الوصفة مباشرة إلى قائمة المشتريات.
        </p>
      </div>
    </div>
  );
};

const DetailedRecipeCard = ({
  recipe,
  onOpen,
  isFavorite,
  onFavorite,
}: {
  key?: React.Key;
  recipe: DetailedRecipe;
  onOpen: () => void;
  isFavorite: boolean;
  onFavorite: () => void;
}) => (
  <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-right shadow-sm hover:shadow-md transition">
    <button onClick={onOpen} className="block w-full text-right">
      <ValidatedFoodImage
        recipe={recipe}
        className="h-48 w-full object-cover"
        alt={recipe.title}
      />
      <div className="p-4">
        <div className="text-xs font-bold text-orange-600">{recipe.group}</div>
        <h3 className="font-black text-lg mt-1 text-slate-900 dark:text-white">{recipe.title}</h3>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
          <span>👥 {recipe.servings}</span>
          <span>⏱️ {recipe.prepMinutes + recipe.cookMinutes} د</span>
          <span>🛒 {recipe.shopping.length} مكونات</span>
        </div>
      </div>
    </button>
    <div className="px-4 pb-4 flex items-center justify-between">
      <button onClick={onOpen} className="text-xs font-black text-orange-600">
        عرض التفاصيل ←
      </button>
      <button
        onClick={onFavorite}
        className={`rounded-xl border px-3 py-2 text-sm font-black ${
          isFavorite
            ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900'
            : 'text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
        }`}
      >
        {isFavorite ? '♥' : '♡'} {isFavorite ? 'مفضلة' : 'مفضلة'}
      </button>
    </div>
  </div>
);

const Header = ({ title, onBack, icon }: { title: string; onBack: () => void; icon?: React.ReactNode }) => (
  <div className="flex items-center gap-3">
    <button
      onClick={onBack}
      className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-2xs"
    >
      <ArrowRight />
    </button>
    <div className="flex items-center gap-2">
      <span className="rounded-xl bg-orange-50 dark:bg-orange-950/40 p-2 text-orange-600">
        {icon || <ChefHat className="w-5" />}
      </span>
      <h1 className="text-2xl font-black text-slate-900 dark:text-white">{title}</h1>
    </div>
  </div>
);

const SectionTitle = ({ text }: { text: string }) => (
  <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 font-black text-slate-900 dark:text-white">
    {text}
  </div>
);

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3">
    <div className="text-[11px] text-slate-500">{label}</div>
    <div className="font-black mt-1 text-slate-900 dark:text-white">{value}</div>
  </div>
);

const RecipeCard = ({
  recipe,
  onOpen,
  onFavorite,
}: {
  key?: React.Key;
  recipe: Recipe;
  onOpen: () => void;
  onFavorite: () => void;
}) => (
  <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
    <button onClick={onOpen} className="block w-full text-right">
      <ValidatedFoodImage
        recipe={recipe}
        className="h-48 w-full object-cover"
        alt={recipe.title}
      />
      <div className="p-4">
        <h3 className="font-black text-lg text-slate-900 dark:text-white">{recipe.title}</h3>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3" />
            {recipe.cookTimeMinutes} د
          </span>
          {recipe.source && (
            <span className="flex items-center gap-1">
              <BookOpen className="w-3" /> مصدر
            </span>
          )}
        </div>
      </div>
    </button>
    <div className="px-4 pb-4 flex items-center justify-between">
      <span className="text-xs font-bold text-orange-600">عرض الوصفة</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFavorite();
        }}
        className="rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300"
      >
        <Heart className={recipe.isFavorite ? 'fill-current text-rose-500' : 'w-4'} />
      </button>
    </div>
  </div>
);
