/**
 * Standard Food & Recipe Interfaces for SMART TIME
 * Supports structured ingredients, steps, timings, serving methods,
 * canonical IDs, deduplication, and AI image metadata.
 */

export interface FoodIngredient {
  name: string;
  amount?: string;
  unit?: string;
  optional?: boolean;
  note?: string;
}

export interface PreparationStep {
  step: number;
  instruction: string;
  durationMinutes?: number;
  tip?: string;
}

export interface FoodImage {
  url: string;
  alt?: string;
  imageHash?: string;
  perceptualHash?: string;
  verified?: boolean;
  prompt?: string;
}

export interface FoodSource {
  name: string;
  author?: string;
  url?: string;
  isAvailable: boolean;
}

export interface DetailedShopping {
  name: string;
  amount: string;
  note?: string;
}

export interface FoodRecipe {
  id: string;
  canonicalId: string;

  // Title / Names
  title: string; // Backward compatibility alias for nameAr
  nameAr: string;
  nameEn?: string;
  aliases?: string[];

  // Categorization
  categoryId: string;
  category?: string;
  groupId?: string;
  group: string;

  description?: string;

  // Structured Recipe Data
  ingredients: FoodIngredient[];
  preparationSteps: PreparationStep[];

  // Backward compatibility fields
  cooking: string[];
  shopping: DetailedShopping[];

  // Timings
  preparationTimeMinutes?: number;
  prepMinutes: number;
  cookingTimeMinutes?: number;
  cookMinutes: number;
  totalTimeMinutes?: number;

  servings?: number;

  // Presentation & Serving
  servingMethod?: string;

  // Images & Verification
  image: string;
  imageData?: FoodImage;

  // Source & Meta
  source?: FoodSource;
  tags?: string[];

  marinade?: string[];
  tips?: string[];

  createdAt?: string;
  updatedAt?: string;
}

export interface FoodCategory {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  recipes: FoodRecipe[];
}

// Duplicate Detection Types
export type DuplicateMatchDegree = 'exact' | 'probable' | 'similar' | 'unique';

export interface DuplicateSimilarityResult {
  matchDegree: DuplicateMatchDegree;
  score: number; // 0 - 100
  reasons: string[];
  matchedRecipe?: FoodRecipe;
  details?: {
    nameScore: number;
    aliasMatch: boolean;
    categoryMatch: boolean;
    ingredientOverlap: number;
  };
}
