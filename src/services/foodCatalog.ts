import { Recipe } from '../types';
import { EGYPTIAN_DISHES } from '../data/egyptianDishes';
import { TAYYIBAT_RECIPES } from '../data/tayyibatSystem';

const img = (q: string) => `https://images.unsplash.com/${q}?auto=format&fit=crop&w=900&q=80`;

/**
 * Expandable food catalog. Recipe classification is kept separate from the
 * original Recipe shape so older saved recipes continue to work.
 * Source-derived entries only use details supported by the uploaded books.
 */
const BASE_FOOD_CATALOG: Recipe[] = [
  {
    id: 'food_koshari', title: 'الكشري المصري', category: 'normal',
    image: img('photo-1601050690597-df0568f70950'), prepTimeMinutes: 10, cookTimeMinutes: 30,
    calories: 0, protein: 0, carbs: 0, fat: 0,
    ingredients: [
      { name: 'بصل', amount: '2', unit: 'بصلة' }, { name: 'طحين أبيض', amount: '1', unit: 'ملعقة كبيرة' },
      { name: 'خل أبيض', amount: '1', unit: 'ملعقة كبيرة' }, { name: 'ملح', amount: '1', unit: 'ملعقة صغيرة' },
      { name: 'زيت نباتي', amount: '1', unit: 'كوب' },
    ],
    steps: ['تحضير التقلية والبصل المقرمش.', 'تحضير دقة الكشري.', 'تحضير صلصة الطماطم وتقديم الإضافات مع الكشري.'],
    isFavorite: false, mainSection: 'eastern', subcategory: 'starches', dietSystems: ['common'],
    source: 'وصفات أطباق رئيسية مصرية', sourceAuthor: 'سباء النعامنه / هيا طلفاح', sourcePage: '1–3',
    tags: ['مصري', 'كشري', 'أرز', 'نشويات'], difficulty: 'medium', servings: 4,
    notes: 'الوصفة الأساسية والإضافات مأخوذة من الملف المرفوع؛ التفاصيل الكاملة المتاحة في المصدر تخص التقلية والدقة والصلصة.'
  },
  {
    id: 'food_raqaq', title: 'رقاق باللحم المفروم', category: 'normal',
    image: img('photo-1601050690117-94f5f6fa8bd7'), prepTimeMinutes: 0, cookTimeMinutes: 30,
    calories: 0, protein: 0, carbs: 0, fat: 0, ingredients: [],
    steps: ['حشو الرقاق باللحم المفروم والبصل والتوابل ثم خبزه حتى يتحمر السطح.'], isFavorite: false,
    mainSection: 'eastern', subcategory: 'pastries', dietSystems: ['common'], source: 'وصفات أطباق رئيسية مصرية', sourceAuthor: 'نور أبو الرب', sourcePage: '3',
    tags: ['مصري', 'رقاق', 'لحمة'], servings: 4, difficulty: 'medium', notes: 'المصدر يعرض ملخص الوصفة فقط.'
  },
  {
    id: 'food_herring_salad', title: 'سلطة الرنجة', category: 'normal',
    image: img('photo-1547592180-85f173990554'), prepTimeMinutes: 0, cookTimeMinutes: 10,
    calories: 0, protein: 0, carbs: 0, fat: 0, ingredients: [],
    steps: ['تحضير سلطة من الرنجة المملحة مع البصل والليمون وزيت الزيتون.'], isFavorite: false,
    mainSection: 'eastern', subcategory: 'starches', dietSystems: ['common'], source: 'وصفات أطباق رئيسية مصرية', sourceAuthor: 'آلاء صالح', sourcePage: '3',
    tags: ['مصري', 'رنجة', 'سمك'], servings: 3, difficulty: 'easy', notes: 'المصدر يعرض ملخص الوصفة فقط.'
  },
  {
    id: 'food_bamia_meat', title: 'البامية باللحمة على الطريقة المصرية', category: 'normal',
    image: img('photo-1601050690117-94f5f6fa8bd7'), prepTimeMinutes: 0, cookTimeMinutes: 95,
    calories: 0, protein: 0, carbs: 0, fat: 0, ingredients: [],
    steps: ['طهي البامية مع مكعبات اللحم والسمن والكزبرة الخضراء بالطريقة المصرية التقليدية.'], isFavorite: false,
    mainSection: 'eastern', subcategory: 'starches', dietSystems: ['common'], source: 'وصفات أطباق رئيسية مصرية', sourceAuthor: 'شروق المعاعيه', sourcePage: '3',
    tags: ['مصري', 'بامية', 'لحمة'], servings: 5, difficulty: 'medium'
  },
  {
    id: 'food_bamia_weka', title: 'البامية الويكة', category: 'normal',
    image: img('photo-1601050690117-94f5f6fa8bd7'), prepTimeMinutes: 0, cookTimeMinutes: 30,
    calories: 0, protein: 0, carbs: 0, fat: 0, ingredients: [],
    steps: ['تحضير البامية بالطريقة الريفية المصرية التقليدية (الويكة).'], isFavorite: false,
    mainSection: 'eastern', subcategory: 'starches', dietSystems: ['common'], source: 'وصفات أطباق رئيسية مصرية', sourceAuthor: 'شروق المعاعيه', sourcePage: '3',
    tags: ['مصري', 'بامية', 'ويكة'], servings: 4, difficulty: 'easy'
  },
  {
    id: 'food_pasta_bechamel_chicken', title: 'المكرونة بالبشاميل بالفراخ', category: 'normal',
    image: img('photo-1551892374-ecf8754cf8b0'), prepTimeMinutes: 0, cookTimeMinutes: 35,
    calories: 0, protein: 0, carbs: 0, fat: 0, ingredients: [],
    steps: ['طهي المكرونة ثم تغطيتها بصوص البشاميل وقطع الفراخ وخبزها حتى يتحمر السطح.'], isFavorite: false,
    mainSection: 'eastern', subcategory: 'pastries', dietSystems: ['common'], source: 'وصفات أطباق رئيسية مصرية', sourceAuthor: 'شروق المعاعيه', sourcePage: '3',
    tags: ['مصري', 'مكرونة', 'بشاميل', 'فراخ'], servings: 4, difficulty: 'medium'
  },
  {
    id: 'food_pasta_bechamel_meat', title: 'المكرونة بالبشاميل باللحم المفروم', category: 'normal',
    image: img('photo-1551892374-ecf8754cf8b0'), prepTimeMinutes: 0, cookTimeMinutes: 70,
    calories: 0, protein: 0, carbs: 0, fat: 0, ingredients: [],
    steps: ['إعداد المكرونة باللحم المفروم وتغطيتها بطبقة من البشاميل ثم خبزها.'], isFavorite: false,
    mainSection: 'eastern', subcategory: 'pastries', dietSystems: ['common'], source: 'وصفات أطباق رئيسية مصرية', sourceAuthor: 'شروق المعاعيه', sourcePage: '3',
    tags: ['مصري', 'مكرونة', 'بشاميل', 'لحمة'], servings: 4, difficulty: 'medium'
  },
  {
    id: 'tayyibat_rice_potato', title: 'أرز بسمتي مع بطاطا', category: 'tayyibat',
    image: img('photo-1512621776951-a57141f2eefd'), prepTimeMinutes: 10, cookTimeMinutes: 30,
    calories: 0, protein: 0, carbs: 0, fat: 0, ingredients: [],
    steps: ['وجبة مبنية على الأرز والبطاطا كما وردت ضمن الأمثلة التطبيقية لنظام الطيبات.'], isFavorite: false,
    mainSection: 'diet', subcategory: 'starches', dietSystems: ['tayyibat'],
    compatibility: { tayyibat: 'allowed' }, source: 'نظام الطيبات — الطبعة الإلكترونية الثانية 2026', sourcePage: '24–28',
    tags: ['الطيبات', 'أرز', 'بطاطا', 'نشويات'], notes: 'تصنيف مستند إلى قائمة المسموحات والأمثلة التطبيقية في الكتاب.'
  },
  {
    id: 'tayyibat_sea_fish', title: 'سمك بحري مشوي مع الأرز والبطاطا', category: 'tayyibat',
    image: img('photo-1544943910-4c1f9a3b4d6a'), prepTimeMinutes: 10, cookTimeMinutes: 25,
    calories: 0, protein: 0, carbs: 0, fat: 0, ingredients: [],
    steps: ['اختيار سمك بحري من الأنواع المسموحة وتقديمه مع الأرز والبطاطا وفق المثال الأسبوعي في الكتاب.'], isFavorite: false,
    mainSection: 'diet', subcategory: 'starches', dietSystems: ['tayyibat'],
    compatibility: { tayyibat: 'allowed' }, source: 'نظام الطيبات — الطبعة الإلكترونية الثانية 2026', sourcePage: '28, 43',
    tags: ['الطيبات', 'سمك', 'أرز', 'بطاطا']
  },
  {
    id: 'tayyibat_stuffed_zucchini', title: 'محشي كوسا بالأرز', category: 'tayyibat',
    image: img('photo-1601050690117-94f5f6fa8bd7'), prepTimeMinutes: 20, cookTimeMinutes: 45,
    calories: 0, protein: 0, carbs: 0, fat: 0, ingredients: [],
    steps: ['الكتاب يذكر محشي الكوسا بالأرز ضمن الخضروات المسموحة ومثال يوم بلا بروتين حيواني.'], isFavorite: false,
    mainSection: 'diet', subcategory: 'starches', dietSystems: ['tayyibat'],
    compatibility: { tayyibat: 'allowed' }, source: 'نظام الطيبات — الطبعة الإلكترونية الثانية 2026', sourcePage: '28, 49',
    tags: ['الطيبات', 'كوسا', 'محشي', 'أرز']
  },
  {
    id: 'tayyibat_dark_halawa', title: 'حلاوة طحينية غامقة', category: 'tayyibat',
    image: img('photo-1599785209707-a456fc1337bb'), prepTimeMinutes: 5, cookTimeMinutes: 0,
    calories: 0, protein: 0, carbs: 0, fat: 0, ingredients: [],
    steps: ['مدرجة في قائمة الحلويات والمربيات المسموحة في الكتاب.'], isFavorite: false,
    mainSection: 'diet', subcategory: 'desserts', dietSystems: ['tayyibat'],
    compatibility: { tayyibat: 'allowed' }, source: 'نظام الطيبات — الطبعة الإلكترونية الثانية 2026', sourcePage: '51',
    tags: ['الطيبات', 'حلويات', 'طحينة']
  },
  {
    id: 'keto_grilled_meat', title: 'لحم مشوي — وصفة أساسية للكيتو', category: 'keto',
    image: img('photo-1544025162-d76694265947'), prepTimeMinutes: 10, cookTimeMinutes: 20,
    calories: 0, protein: 0, carbs: 0, fat: 0, ingredients: [],
    steps: ['قالب وصفة قابل للتوسع للكيتو؛ لم تُنسب للكتب المرفوعة.'], isFavorite: false,
    mainSection: 'diet', subcategory: 'starches', dietSystems: ['keto'], source: 'قاعدة SMART TIME',
    tags: ['كيتو', 'لحوم'], notes: 'قالب أولي لإثبات بنية نظام الكيتو، ويجب استكمال بيانات المكونات والقيم الغذائية لاحقاً.'
  },
];


const egyptianRecipes: Recipe[] = EGYPTIAN_DISHES.map((dish) => ({
  id: dish.dishId || dish.id,
  title: dish.title || dish.name,
  category: dish.category === 'dessert' ? 'dessert' : 'normal',
  image: dish.imageUrl || dish.image,
  prepTimeMinutes: dish.prepMinutes || 15,
  cookTimeMinutes: dish.cookMinutes || 45,
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  ingredients: (dish.ingredients || []).map((item) => ({
    name: typeof item === 'string' ? item : item.name,
    amount: typeof item === 'string' ? 'حسب الرغبة' : (item.amount || 'حسب الرغبة'),
    unit: typeof item === 'string' ? '' : (item.unit || ''),
  })),
  steps: dish.steps,
  isFavorite: false,
  mainSection: dish.category === 'dessert' ? 'eastern_desserts' : 'eastern',
  subcategory: dish.category === 'dessert' ? 'desserts' : 'starches',
  dietSystems: ['common'],
  tags: ['مصري', dish.group, dish.category === 'dessert' ? 'حلويات' : 'وجبات'],
  source: 'مكتبة وصفات SMART TIME',
  servings: dish.servings || 4,
}));

const tayyibatRecipes: Recipe[] = TAYYIBAT_RECIPES.map((recipe) => ({
  id: recipe.id,
  title: recipe.title,
  category: recipe.type === 'حلوى' ? 'dessert' : 'tayyibat',
  image: recipe.imageUrl,
  prepTimeMinutes: 10,
  cookTimeMinutes: recipe.type === 'حلوى' ? 0 : 30,
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  ingredients: recipe.ingredients.map((name) => ({ name, amount: 'حسب الوصفة', unit: '' })),
  steps: recipe.steps,
  isFavorite: false,
  mainSection: 'diet',
  subcategory: recipe.type === 'حلوى' ? 'desserts' : 'starches',
  dietSystems: ['tayyibat'],
  compatibility: { tayyibat: 'allowed' },
  source: 'تقرير نظام الطيبات المرفوع',
  tags: ['الطيبات', recipe.type],
  notes: recipe.sourceNote,
}));

export const FOOD_CATALOG: Recipe[] = [
  ...BASE_FOOD_CATALOG,
  ...egyptianRecipes,
  ...tayyibatRecipes,
];
