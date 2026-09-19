import type { DetailedCategory, DetailedRecipe } from './detailedFoodLibrary';

export function getAllDetailedCategories(
  categories: DetailedCategory[],
  expansion: Partial<Record<DetailedCategory['id'], DetailedRecipe[]>>
): DetailedCategory[] {
  return categories.map((category) => ({
    ...category,
    recipes: [
      ...(category.recipes || []),
      ...(expansion?.[category.id] || []),
    ],
  }));
}
