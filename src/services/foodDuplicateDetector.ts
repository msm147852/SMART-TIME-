/**
 * Food Recipe Duplicate Detection and Safe Merge Engine
 * Detects duplicates using canonical normalization, Levenshtein distance,
 * token overlap, alias matching, and ingredient intersection.
 */

import { FoodRecipe, DuplicateSimilarityResult, FoodIngredient } from '../types/food';

/**
 * Normalizes Arabic food text by removing diacritics (tashkeel),
 * standardizing alef/yaa/taa-marbuta, stripping leading 'ال', and removing symbols.
 */
export function normalizeFoodName(text: string): string {
  if (!text) return '';
  let str = text.trim().toLowerCase();

  // Remove Arabic diacritics (Tashkeel)
  str = str.replace(/[\u064B-\u065F\u0670]/g, '');

  // Normalize Alef variants: أ, إ, آ, ٱ -> ا
  str = str.replace(/[أإآٱ]/g, 'ا');

  // Normalize Taa Marbuta: ة -> ه
  str = str.replace(/ة/g, 'ه');

  // Normalize Yaa: ى -> ي
  str = str.replace(/ى/g, 'ي');

  // Normalize Persian/Urdu Kaf & Gaf if any
  str = str.replace(/ك/g, 'ك').replace(/ي/g, 'ي');

  // Strip punctuation and extra spaces
  str = str.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, ' ');
  str = str.replace(/\s+/g, ' ').trim();

  return str;
}

/**
 * Strips leading definite article "ال" from words in a normalized string.
 */
export function stripDefiniteArticles(normalizedText: string): string {
  const words = normalizedText.split(' ').map(w => {
    if (w.startsWith('ال') && w.length > 3) {
      return w.slice(2);
    }
    return w;
  });
  return words.join(' ');
}

/**
 * Generates a deterministic canonical ID from Arabic name.
 */
export function generateCanonicalId(nameAr: string, categoryId = 'recipe'): string {
  const normalized = normalizeFoodName(nameAr);
  const stripped = stripDefiniteArticles(normalized);
  const slug = stripped
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_\u0600-\u06FF]/gi, '');
  return `canonical_${categoryId}_${slug}`.slice(0, 60);
}

/**
 * Computes Levenshtein edit distance between two strings.
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Calculates string similarity percentage (0 - 100).
 */
export function calculateStringSimilarity(s1: string, s2: string): number {
  if (!s1 && !s2) return 100;
  if (!s1 || !s2) return 0;
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 100;
  const distance = calculateLevenshteinDistance(longer, shorter);
  return Math.round(((longer.length - distance) / longer.length) * 100);
}

/**
 * Evaluates similarity between a candidate recipe and an existing recipe.
 */
export function calculateRecipeSimilarity(
  candidate: Partial<FoodRecipe>,
  existing: FoodRecipe
): DuplicateSimilarityResult {
  const reasons: string[] = [];

  // 0. Exact ID Match Check (Highest Priority)
  if (candidate.id && existing.id && candidate.id === existing.id) {
    return {
      matchDegree: 'exact',
      score: 100,
      reasons: ['تطابق تام في المعرف الفريد (ID)'],
      matchedRecipe: existing,
      details: {
        nameScore: 100,
        aliasMatch: true,
        categoryMatch: true,
        ingredientOverlap: 100,
      },
    };
  }

  const candNameNorm = normalizeFoodName(candidate.nameAr || candidate.title || '');
  const existNameNorm = normalizeFoodName(existing.nameAr || existing.title || '');
  const candStripped = stripDefiniteArticles(candNameNorm);
  const existStripped = stripDefiniteArticles(existNameNorm);

  // 1. Direct Name Match
  const directNameSim = Math.max(
    calculateStringSimilarity(candNameNorm, existNameNorm),
    calculateStringSimilarity(candStripped, existStripped)
  );

  let nameScore = directNameSim;
  if (directNameSim >= 90) {
    reasons.push('تطابق كبير في الاسم العربي');
  }

  // 2. Aliases Match
  let aliasMatch = false;
  const candAliases = (candidate.aliases || []).map(normalizeFoodName);
  const existAliases = (existing.aliases || []).map(normalizeFoodName);

  if (
    candAliases.some(a => a === existNameNorm || existAliases.includes(a)) ||
    existAliases.some(a => a === candNameNorm)
  ) {
    aliasMatch = true;
    nameScore = Math.max(nameScore, 98);
    reasons.push('تطابق مع الأسماء البديلة (Aliases)');
  }

  // 3. English Name Match
  if (candidate.nameEn && existing.nameEn) {
    const enSim = calculateStringSimilarity(
      candidate.nameEn.trim().toLowerCase(),
      existing.nameEn.trim().toLowerCase()
    );
    if (enSim >= 85) {
      reasons.push('تطابق في الاسم الإنجليزي');
      nameScore = Math.max(nameScore, enSim);
    }
  }

  // 4. Category / Group Match
  const categoryMatch =
    (candidate.categoryId && candidate.categoryId === existing.categoryId) ||
    (candidate.group && candidate.group === existing.group);

  if (categoryMatch) {
    reasons.push('نفس القسم والمجموعة');
  }

  // 5. Ingredient Overlap
  let ingredientOverlap = 0;
  const candIngs = (candidate.ingredients || [])
    .map(i => (typeof i === 'string' ? normalizeFoodName(i) : normalizeFoodName(i?.name || '')))
    .filter(Boolean);
  const existIngs = (existing.ingredients || [])
    .map(i => (typeof i === 'string' ? normalizeFoodName(i) : normalizeFoodName(i?.name || '')))
    .filter(Boolean);

  if (candIngs.length > 0 && existIngs.length > 0) {
    const intersection = candIngs.filter(i => existIngs.some(ei => calculateStringSimilarity(i, ei) >= 75));
    ingredientOverlap = Math.round((intersection.length / Math.max(candIngs.length, existIngs.length)) * 100);
    if (ingredientOverlap >= 60) {
      reasons.push(`تطابق في المكونات الأساسية بنسبة ${ingredientOverlap}%`);
    }
  }

  // 6. Image Match (if same custom URL)
  if (candidate.image && existing.image && candidate.image === existing.image) {
    reasons.push('تطابق في الصورة');
  }

  // Composite Weighted Score Calculation
  let overallScore = 0;
  if (candStripped === existStripped || aliasMatch) {
    overallScore = 98;
  } else {
    // 60% Name + 25% Ingredients + 15% Category
    overallScore = Math.round(
      nameScore * 0.6 +
      ingredientOverlap * 0.25 +
      (categoryMatch ? 15 : 0)
    );
  }

  // Normalize final score to 100 max
  overallScore = Math.min(100, Math.max(0, overallScore));

  let matchDegree: DuplicateSimilarityResult['matchDegree'] = 'unique';
  if (overallScore >= 95) {
    matchDegree = 'exact';
  } else if (overallScore >= 80) {
    matchDegree = 'probable';
  } else if (overallScore >= 60) {
    matchDegree = 'similar';
  } else {
    matchDegree = 'unique';
  }

  return {
    matchDegree,
    score: overallScore,
    reasons,
    matchedRecipe: existing,
    details: {
      nameScore,
      aliasMatch,
      categoryMatch: !!categoryMatch,
      ingredientOverlap,
    },
  };
}

/**
 * Searches an existing list of recipes for duplicates or near-duplicates.
 */
export function detectDuplicates(
  candidate: Partial<FoodRecipe>,
  existingRecipes: FoodRecipe[]
): DuplicateSimilarityResult {
  let highestResult: DuplicateSimilarityResult = {
    matchDegree: 'unique',
    score: 0,
    reasons: [],
  };

  for (const existing of existingRecipes) {
    const result = calculateRecipeSimilarity(candidate, existing);
    if (result.score > highestResult.score) {
      highestResult = result;
    }
  }

  return highestResult;
}

/**
 * Safely merges an incoming recipe into an existing recipe without losing any detailed data.
 */
export function mergeRecipes(
  existing: FoodRecipe,
  incoming: Partial<FoodRecipe>
): FoodRecipe {
  // 1. Merge Aliases uniquely
  const allAliases = Array.from(
    new Set([
      ...(existing.aliases || []),
      ...(incoming.aliases || []),
      incoming.nameAr,
      incoming.title,
    ].filter(Boolean) as string[])
  ).filter(a => a !== existing.nameAr && a !== existing.title);

  // 2. Merge Tags uniquely
  const allTags = Array.from(
    new Set([
      ...(existing.tags || []),
      ...(incoming.tags || []),
      existing.group,
      incoming.group,
    ].filter(Boolean) as string[])
  );

  // 3. Choose the most complete ingredients list
  const existingIngCount = (existing.ingredients || []).length;
  const incomingIngCount = (incoming.ingredients || []).length;
  const ingredients: FoodIngredient[] =
    incomingIngCount > existingIngCount
      ? (incoming.ingredients as FoodIngredient[])
      : (existing.ingredients || []);

  // 4. Choose preparation steps & cooking safely
  const existingStepCount = (existing.preparationSteps || []).length;
  const incomingStepCount = (incoming.preparationSteps || []).length;
  let preparationSteps =
    incomingStepCount > existingStepCount
      ? (incoming.preparationSteps || [])
      : (existing.preparationSteps || []);

  let cooking = existing.cooking || incoming.cooking || [];
  if (preparationSteps && preparationSteps.length > 0) {
    cooking = preparationSteps.map(s => (typeof s === 'string' ? s : s.instruction || ''));
  } else if (cooking && cooking.length > 0) {
    preparationSteps = cooking.map((step, idx) => ({ step: idx + 1, instruction: typeof step === 'string' ? step : String(step) }));
  }

  // 5. Shopping list
  const shopping =
    existing.shopping ||
    incoming.shopping ||
    ingredients.map(i => ({
      name: i.name,
      amount: i.amount || 'حسب الرغبة',
      note: i.note,
    }));

  return {
    ...existing,
    aliases: allAliases,
    tags: allTags,
    ingredients,
    shopping,
    preparationSteps,
    cooking,
    nameEn: existing.nameEn || incoming.nameEn,
    description: existing.description || incoming.description || existing.title,
    prepMinutes: existing.prepMinutes || incoming.prepMinutes || 15,
    cookMinutes: existing.cookMinutes || incoming.cookMinutes || 20,
    preparationTimeMinutes: existing.preparationTimeMinutes || incoming.preparationTimeMinutes || existing.prepMinutes || 15,
    cookingTimeMinutes: existing.cookingTimeMinutes || incoming.cookingTimeMinutes || existing.cookMinutes || 20,
    totalTimeMinutes: (existing.prepMinutes || 15) + (existing.cookMinutes || 20),
    servings: existing.servings || incoming.servings || 4,
    servingMethod: existing.servingMethod || incoming.servingMethod || 'يقدم ساخناً كطبق رئيسي مميز.',
    tips: Array.from(new Set([...(existing.tips || []), ...(incoming.tips || [])])),
    marinade: Array.from(new Set([...(existing.marinade || []), ...(incoming.marinade || [])])),
    source: existing.source || incoming.source || { name: 'المطبخ المصري الأصيل', isAvailable: true },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Takes an array of food recipes, detects duplicates, merges their info,
 * and returns a deduplicated list with preserved unique IDs.
 */
export function deduplicateFoodList(recipes: FoodRecipe[]): FoodRecipe[] {
  const result: FoodRecipe[] = [];

  for (const recipe of recipes) {
    if (!recipe) continue;

    // 1. Direct ID match first
    const existingIndexById = recipe.id ? result.findIndex(r => r.id === recipe.id) : -1;
    if (existingIndexById !== -1) {
      result[existingIndexById] = mergeRecipes(result[existingIndexById], recipe);
      continue;
    }

    // 2. Similarity match (name, aliases, ingredients, category)
    const existingIndex = result.findIndex(existing => {
      const sim = calculateRecipeSimilarity(recipe, existing);
      return sim.score >= 75 || sim.matchDegree === 'exact' || sim.matchDegree === 'probable';
    });

    if (existingIndex !== -1) {
      // Merge with existing
      result[existingIndex] = mergeRecipes(result[existingIndex], recipe);
    } else {
      result.push(recipe);
    }
  }

  // 3. Final safety check: guarantee 100% unique IDs across the result list
  const finalResult: FoodRecipe[] = [];
  const seenIds = new Set<string>();

  for (let idx = 0; idx < result.length; idx++) {
    const item = result[idx];
    if (!item.id || seenIds.has(item.id)) {
      const uniqueId = item.id ? `${item.id}_${idx + 1}` : `recipe_${idx + 1}`;
      finalResult.push({ ...item, id: uniqueId });
      seenIds.add(uniqueId);
    } else {
      finalResult.push(item);
      seenIds.add(item.id);
    }
  }

  return finalResult;
}

