import type { DetailedRecipe } from './detailedFoodLibrary';

/**
 * Every recipe gets its own AI-generated image from the SMART TIME server.
 * The server uses GEMINI_API_KEY and caches generated images in memory.
 * This removes the old problem where unrelated dishes shared the same photo.
 */
export function foodImageFor(recipe: DetailedRecipe): string {
  const params = new URLSearchParams({
    title: recipe.title,
    category: recipe.category,
    group: recipe.group,
  });
  return `/api/food/generated-image?${params.toString()}`;
}

export const FOOD_IMAGE_CREDITS: Record<string, { file: string; source: string }> = {};

