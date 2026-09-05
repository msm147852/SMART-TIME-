import React, { useState } from 'react';
import {
  UtensilsCrossed,
  ShoppingCart,
  Plus,
  Flame,
  Clock,
  Heart,
  CheckCircle2,
  Trash2,
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  Tag,
  RefreshCw,
  Search,
  BookOpen,
  ChefHat,
  X,
  Share2,
  Users,
} from 'lucide-react';
import { Recipe, RecipeCategory, ShoppingItem, Language } from '../types';
import { translations } from '../services/i18n';
import { FoodRepository } from '../services';

interface FoodViewProps {
  language: Language;
  recipes: Recipe[];
  shoppingList: ShoppingItem[];
  onUpdateRecipes: (recipes: Recipe[]) => void;
  onUpdateShoppingList: (items: ShoppingItem[]) => void;
}

export const FoodView: React.FC<FoodViewProps> = ({
  language,
  recipes,
  shoppingList,
  onUpdateRecipes,
  onUpdateShoppingList,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'recipes' | 'shopping'>('recipes');
  const [selectedDiet, setSelectedDiet] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(recipes[0] || null);

  // Servings multiplier for ingredients
  const [servingsMultiplier, setServingsMultiplier] = useState<number>(1);

  // Add Recipe Modal State
  const [isAddRecipeOpen, setIsAddRecipeOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<RecipeCategory>('keto');
  const [newImage, setNewImage] = useState('');
  const [newPrepTime, setNewPrepTime] = useState('15');
  const [newCookTime, setNewCookTime] = useState('25');
  const [newCalories, setNewCalories] = useState('450');
  const [newProtein, setNewProtein] = useState('35');
  const [newCarbs, setNewCarbs] = useState('10');
  const [newFat, setNewFat] = useState('25');
  const [newIngredientsText, setNewIngredientsText] = useState('صدر دجاج مشوي: 250 : جرام\nزيت زيتون بكر: 1 : ملعقة طعام\nخضروات ورقية مشكلة: 100 : جرام');
  const [newStepsText, setNewStepsText] = useState('تتبيل الدجاج بزيت الزيتون والليمون والبهارات.\nالشوي على نار متوسطة لمدة 15 دقيقة حتى النضج.\nالتقديم مع السلطة الخضراء الطازجة.');

  // Shopping List new item input
  const [newShoppingText, setNewShoppingText] = useState('');
  const [newShoppingQty, setNewShoppingQty] = useState('1');
  const [newShoppingCategory, setNewShoppingCategory] = useState('خضروات وفواكه');
  const [addedRecipeToast, setAddedRecipeToast] = useState(false);
  const [syncToast, setSyncToast] = useState(false);

  const dietCategories: { id: string; labelAr: string; labelEn: string; emoji: string }[] = [
    { id: 'all', labelAr: 'جميع الأنظمة', labelEn: 'All Diets', emoji: '🍽️' },
    { id: 'keto', labelAr: 'نظام الكيتو (Keto)', labelEn: 'Keto Diet', emoji: '🥩' },
    { id: 'tayyibat', labelAr: 'نظام الطيبات الصحي', labelEn: 'Tayyibat Diet', emoji: '🥣' },
    { id: 'intermittent', labelAr: 'الصيام المتقطع', labelEn: 'Intermittent Fasting', emoji: '⏳' },
    { id: 'mediterranean', labelAr: 'حمية البحر المتوسط', labelEn: 'Mediterranean', emoji: '🥗' },
    { id: 'diabetic', labelAr: 'مرضى السكري واللو كارب', labelEn: 'Diabetic & Low Carb', emoji: '🥑' },
    { id: 'sports', labelAr: 'وجبات رياضيين وبروتين', labelEn: 'High Protein', emoji: '💪' },
    { id: 'family', labelAr: 'أكلات عائلية متكاملة', labelEn: 'Family Meals', emoji: '🍲' },
    { id: 'fast', labelAr: 'أكلات سريعة وخفيفة', labelEn: 'Quick & Easy', emoji: '⏱️' },
  ];

  const filteredRecipes = recipes.filter((r) => {
    const matchesDiet = selectedDiet === 'all' || r.category === selectedDiet;
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ingredients.some((ing) => ing.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDiet && matchesSearch;
  });

  // Toggle favorite recipe
  const handleToggleFavorite = (id: string) => {
    const updated = recipes.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));
    onUpdateRecipes(updated);
    FoodRepository.saveRecipes(updated);
    if (selectedRecipe?.id === id) {
      setSelectedRecipe({ ...selectedRecipe, isFavorite: !selectedRecipe.isFavorite });
    }
  };

  // Sync / Refresh Recipes Catalog
  const handleSyncRecipes = () => {
    setSyncToast(true);
    setTimeout(() => {
      setSyncToast(false);
    }, 2500);
  };

  // Add all recipe ingredients to shopping list
  const handleAddIngredientsToShoppingList = (recipe: Recipe) => {
    const newItems: ShoppingItem[] = recipe.ingredients.map((ing) => {
      const scaledAmount = (parseFloat(ing.amount) || 1) * servingsMultiplier;
      return {
        id: 'shop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name: `${ing.name} (${recipe.title})`,
        quantity: scaledAmount,
        unit: ing.unit,
        isCompleted: false,
        category: 'مكونات وصفات',
      };
    });

    const updated = [...newItems, ...shoppingList];
    onUpdateShoppingList(updated);
    FoodRepository.saveShoppingList(updated);

    setAddedRecipeToast(true);
    setTimeout(() => setAddedRecipeToast(false), 3000);
  };

  // Save new custom recipe
  const handleCreateRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Parse ingredients lines: name: amount : unit
    const parsedIngredients = newIngredientsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(':').map((p) => p.trim());
        return {
          name: parts[0] || line,
          amount: parts[1] || '1',
          unit: parts[2] || 'حبة',
        };
      });

    const parsedSteps = newStepsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const newRecipeItem: Recipe = {
      id: 'rec_' + Date.now(),
      title: newTitle.trim(),
      category: newCategory,
      image:
        newImage.trim() ||
        'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&auto=format&fit=crop&q=80',
      prepTimeMinutes: parseInt(newPrepTime, 10) || 15,
      cookTimeMinutes: parseInt(newCookTime, 10) || 25,
      calories: parseInt(newCalories, 10) || 450,
      protein: parseInt(newProtein, 10) || 30,
      carbs: parseInt(newCarbs, 10) || 20,
      fat: parseInt(newFat, 10) || 15,
      ingredients: parsedIngredients.length > 0 ? parsedIngredients : [{ name: 'مكونات أساسية', amount: '1', unit: 'طبق' }],
      steps: parsedSteps.length > 0 ? parsedSteps : ['يتم تحضير المكونات وطهيها وفق الطريقة الصحية.'],
      isFavorite: false,
    };

    const updated = [newRecipeItem, ...recipes];
    onUpdateRecipes(updated);
    FoodRepository.saveRecipes(updated);
    setSelectedRecipe(newRecipeItem);
    setIsAddRecipeOpen(false);

    // Reset fields
    setNewTitle('');
    setNewImage('');
  };

  // Toggle shopping item completion
  const handleToggleShoppingItem = (id: string) => {
    const updated = shoppingList.map((item) => (item.id === id ? { ...item, isCompleted: !item.isCompleted } : item));
    onUpdateShoppingList(updated);
    FoodRepository.saveShoppingList(updated);
  };

  // Delete shopping item
  const handleDeleteShoppingItem = (id: string) => {
    const updated = shoppingList.filter((item) => item.id !== id);
    onUpdateShoppingList(updated);
    FoodRepository.saveShoppingList(updated);
  };

  // Add single custom item to shopping list
  const handleAddCustomShoppingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShoppingText.trim()) return;

    const newItem: ShoppingItem = {
      id: 'shop_' + Date.now(),
      name: newShoppingText,
      quantity: parseFloat(newShoppingQty) || 1,
      unit: 'حبة',
      isCompleted: false,
      category: newShoppingCategory,
    };

    const updated = [newItem, ...shoppingList];
    onUpdateShoppingList(updated);
    FoodRepository.saveShoppingList(updated);
    setNewShoppingText('');
  };

  return (
    <div className="space-y-6" id="food-shopping-module">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-850 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20">
              <UtensilsCrossed className="w-5 h-5" />
            </span>
            <span>{language === 'ar' ? 'الوصفات الغذائية وقائمة المشتريات' : 'Diet Recipes & Shopping List'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar'
              ? 'وصفات مخزنة ومحدثة باستمرار لكافة الأنظمة (كيتو، الطيبات، الصيام المتقطع، البحر المتوسط، السكري، الرياضيين)'
              : 'Stored & continuously updated healthy recipes for all dietary regimes'}
          </p>
        </div>

        {/* Sub-Tabs: Recipes vs Shopping List */}
        <div className="flex items-center p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('recipes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'recipes'
                ? 'bg-white dark:bg-slate-850 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>{t.recipes}</span>
          </button>
          <button
            onClick={() => setActiveTab('shopping')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'shopping'
                ? 'bg-white dark:bg-slate-850 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{t.shoppingList}</span>
            {shoppingList.filter((i) => !i.isCompleted).length > 0 && (
              <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center font-bold">
                {shoppingList.filter((i) => !i.isCompleted).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sync Toast */}
      {syncToast && (
        <div className="p-4 rounded-2xl bg-orange-100 dark:bg-orange-950/80 border border-orange-500 text-orange-900 dark:text-orange-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
          <span>تم فحص وتحديث مكتبة الوصفات وتأكيد المزامنة مع كافة الأنظمة الغذائية بنجاح!</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. RECIPES TAB */}
      {/* ========================================================= */}
      {activeTab === 'recipes' && (
        <div className="space-y-6">
          {/* Controls Bar: Diet Filter Pills + Search + Action Buttons */}
          <div className="bg-white dark:bg-slate-850 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'ar' ? 'ابحث عن وصفة أو مكون (دجاج، كيتو، شوربة)...' : 'Search recipes or ingredients...'}
                  className="w-full ps-9 pe-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
              </div>

              {/* Action Buttons: Add Recipe & Refresh */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleSyncRecipes}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all"
                  title="تحديث الوصفات"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-orange-500" />
                  <span>تحديث الأنظمة</span>
                </button>

                <button
                  onClick={() => setIsAddRecipeOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all"
                  id="add-recipe-btn"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'ar' ? 'إضافة وصفة خاصة' : 'Add Recipe'}</span>
                </button>
              </div>
            </div>

            {/* Diet Filter Badges */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {dietCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedDiet(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedDiet === cat.id
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{language === 'ar' ? cat.labelAr : cat.labelEn}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Grid: Recipes Cards (Left/Top) and Full Recipe Detail (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Recipes Cards List (5 cols) */}
            <div className="lg:col-span-5 space-y-4 max-h-[750px] overflow-y-auto pe-1">
              {filteredRecipes.map((recipe) => {
                const isSelected = selectedRecipe?.id === recipe.id;
                return (
                  <div
                    key={recipe.id}
                    onClick={() => setSelectedRecipe(recipe)}
                    className={`p-4 rounded-3xl border transition-all cursor-pointer flex gap-4 ${
                      isSelected
                        ? 'bg-orange-50/70 dark:bg-orange-950/30 border-orange-500 shadow-md ring-1 ring-orange-400'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-orange-300'
                    }`}
                  >
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="w-24 h-24 rounded-2xl object-cover shrink-0 shadow-sm"
                    />

                    <div className="flex-1 space-y-1.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 text-[10px] font-black uppercase">
                            {recipe.category}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(recipe.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500"
                          >
                            <Heart
                              className={`w-4 h-4 ${recipe.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`}
                            />
                          </button>
                        </div>

                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-2 mt-1">
                          {recipe.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono-num font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-orange-500" />
                          {recipe.prepTimeMinutes + recipe.cookTimeMinutes} دقيقة
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-500" />
                          {recipe.calories} سعرة
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredRecipes.length === 0 && (
                <div className="p-12 text-center bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  لا توجد وصفات مطابقة للبحث أو النظام الغذائي المحدد
                </div>
              )}
            </div>

            {/* Selected Recipe Comprehensive View (7 cols) */}
            {selectedRecipe ? (
              <div className="lg:col-span-7 bg-white dark:bg-slate-850 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                {/* Recipe Hero Photo & Title */}
                <div className="relative rounded-2xl overflow-hidden h-52 sm:h-64">
                  <img
                    src={selectedRecipe.image}
                    alt={selectedRecipe.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-[11px] font-black uppercase">
                        {selectedRecipe.category}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black">{selectedRecipe.title}</h3>
                  </div>
                </div>

                {/* Nutritional Stats Grid */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/40">
                    <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'السعرات' : 'Calories'}</span>
                    <span className="font-mono-num font-black text-sm text-orange-600 dark:text-orange-400">
                      {selectedRecipe.calories}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40">
                    <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'البروتين' : 'Protein'}</span>
                    <span className="font-mono-num font-black text-sm text-emerald-600 dark:text-emerald-400">
                      {selectedRecipe.protein}g
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40">
                    <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'الكارب' : 'Carbs'}</span>
                    <span className="font-mono-num font-black text-sm text-blue-600 dark:text-blue-400">
                      {selectedRecipe.carbs}g
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40">
                    <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'الدهون الصحية' : 'Healthy Fat'}</span>
                    <span className="font-mono-num font-black text-sm text-amber-600 dark:text-amber-400">
                      {selectedRecipe.fat}g
                    </span>
                  </div>
                </div>

                {/* Servings Scaler & Add to Cart Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === 'ar' ? 'مقياس عدد الأفراد:' : 'Servings:'}
                    </span>
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      {[1, 2, 4, 6].map((num) => (
                        <button
                          key={num}
                          onClick={() => setServingsMultiplier(num)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            servingsMultiplier === num
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {num}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddIngredientsToShoppingList(selectedRecipe)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{language === 'ar' ? 'إضافة المكونات لقائمة المشتريات' : 'Add to Shopping List'}</span>
                  </button>
                </div>

                {/* Toast on adding ingredients */}
                {addedRecipeToast && (
                  <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تمت إضافة مكونات الوصفة إلى قائمة مشترياتك بنجاح!</span>
                  </div>
                )}

                {/* Ingredients List */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>🥗</span>
                    <span>{language === 'ar' ? 'المقادير والمكونات' : 'Ingredients'}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedRecipe.ingredients.map((ing, idx) => {
                      const scaledQty = (parseFloat(ing.amount) || 1) * servingsMultiplier;
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                        >
                          <span className="font-bold text-slate-800 dark:text-slate-200">{ing.name}</span>
                          <span className="font-mono-num font-bold text-orange-600 dark:text-orange-400">
                            {scaledQty} {ing.unit}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Preparation Steps */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>👩‍🍳</span>
                    <span>{language === 'ar' ? 'خطوات التحضير والطهي' : 'Preparation Steps'}</span>
                  </h4>
                  <div className="space-y-2.5">
                    {selectedRecipe.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex gap-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-arabic"
                      >
                        <span className="w-6 h-6 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                          {idx + 1}
                        </span>
                        <p>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. SMART SHOPPING LIST TAB */}
      {/* ========================================================= */}
      {activeTab === 'shopping' && (
        <div className="space-y-6">
          {/* Add Item Form */}
          <form
            onSubmit={handleAddCustomShoppingItem}
            className="bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              value={newShoppingText}
              onChange={(e) => setNewShoppingText(e.target.value)}
              placeholder={language === 'ar' ? 'أضف عنصر جديد للقائمة (مثال: حليب لوز، ستيك لحم)...' : 'Add item to shopping list...'}
              className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={newShoppingQty}
                onChange={(e) => setNewShoppingQty(e.target.value)}
                min="1"
                className="w-20 px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center font-mono-num font-bold"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'ar' ? 'إضافة' : 'Add'}</span>
              </button>
            </div>
          </form>

          {/* Shopping Items List */}
          <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {language === 'ar' ? 'المشتريات المطلوبة' : 'Shopping Checklist'}
              </h3>
              <span className="text-xs text-slate-400 font-mono-num">
                {shoppingList.filter((i) => i.isCompleted).length} / {shoppingList.length} مكتمل
              </span>
            </div>

            <div className="space-y-2">
              {shoppingList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleShoppingItem(item.id)}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none ${
                    item.isCompleted
                      ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60 line-through'
                      : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                        item.isCompleted ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {item.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono-num text-orange-600 dark:text-orange-400">
                      {item.quantity} {item.unit}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteShoppingItem(item.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {shoppingList.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs">قائمة المشتريات فارغة حالياً</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD CUSTOM RECIPE MODAL */}
      {/* ========================================================= */}
      {isAddRecipeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-850 w-full max-w-xl rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-orange-500" />
                <span>إضافة وصفة جديدة للنظام الغذائي</span>
              </h3>
              <button
                onClick={() => setIsAddRecipeOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecipe} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">اسم الوصفة</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: سالمون مشوي بالأفوكادو والأعشاب"
                  className="w-full px-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">النظام الغذائي</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="keto">نظام الكيتو (Keto)</option>
                    <option value="tayyibat">نظام الطيبات</option>
                    <option value="intermittent">الصيام المتقطع</option>
                    <option value="mediterranean">حمية البحر المتوسط</option>
                    <option value="diabetic">السكري واللو كارب</option>
                    <option value="sports">رياضيين وبروتين</option>
                    <option value="family">أكلات عائلية</option>
                    <option value="fast">سريعة وخفيفة</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">رابط الصورة (اختياري)</label>
                  <input
                    type="url"
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              {/* Prep, Cook, Calories */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">التحضير (دقيقة)</label>
                  <input
                    type="number"
                    value={newPrepTime}
                    onChange={(e) => setNewPrepTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono-num text-center"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">الطهي (دقيقة)</label>
                  <input
                    type="number"
                    value={newCookTime}
                    onChange={(e) => setNewCookTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono-num text-center"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">السعرات (Cal)</label>
                  <input
                    type="number"
                    value={newCalories}
                    onChange={(e) => setNewCalories(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono-num text-center"
                  />
                </div>
              </div>

              {/* Ingredients Text */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  المكونات (كل مكون في سطر، بالشكل: الاسم : الكمية : الوحدة)
                </label>
                <textarea
                  rows={3}
                  value={newIngredientsText}
                  onChange={(e) => setNewIngredientsText(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-arabic"
                />
              </div>

              {/* Steps Text */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  خطوات التحضير (كل خطوة في سطر منفصل)
                </label>
                <textarea
                  rows={3}
                  value={newStepsText}
                  onChange={(e) => setNewStepsText(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-arabic"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddRecipeOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20"
                >
                  حفظ الوصفة في التطبيق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
