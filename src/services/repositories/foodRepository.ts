import { Recipe, ShoppingItem } from '../../types';
import { STORAGE_KEYS } from '../storageKeys';
import { StorageAdapter } from '../storageAdapter';
import { DEFAULT_RECIPES, DEFAULT_SHOPPING_ITEMS } from '../seedData';
import { FOOD_CATALOG } from '../foodCatalog';
import { validateRecipeImage, getRecipeCanonicalId, computeImageHash } from '../foodImageService';
import { generateVirtualFoodPhoto, VirtualPhotoTheme } from '../virtualFoodPhotoService';

export interface CachedFoodImage {
  canonicalId: string;
  validatedUrl: string;
  imageHash: string;
  virtualPhotoUrl?: string;
  virtualPhotoTheme?: VirtualPhotoTheme | string;
  isVerified: boolean;
  cachedAt: number;
  lastAccessedAt?: number;
  viewCount?: number;
}

export interface CacheStats {
  count: number;
  totalCached: number;
  sizeBytes: number;
  virtualPhotosCount: number;
  verifiedCount: number;
  keys: string[];
}

export class FoodRepository {
  /**
   * Reads entire image & virtual photo cache from localStorage
   */
  static getImageCache(): Record<string, CachedFoodImage> {
    return StorageAdapter.getItem<Record<string, CachedFoodImage>>(STORAGE_KEYS.FOOD_IMAGE_CACHE, {});
  }

  /**
   * Retrieves single cached recipe image information by canonicalId or id
   */
  static getCachedImage(key: string): CachedFoodImage | null {
    if (!key) return null;
    const cache = this.getImageCache();
    const cleanKey = key.trim();
    const entry = cache[cleanKey] || null;
    if (entry) {
      entry.lastAccessedAt = Date.now();
      entry.viewCount = (entry.viewCount || 0) + 1;
    }
    return entry;
  }

  /**
   * Saves or updates a validated image / virtual photo entry in localStorage cache
   */
  static setCachedImage(
    key: string,
    data: Partial<CachedFoodImage> & { validatedUrl?: string; canonicalId?: string }
  ): void {
    if (!key) return;
    const cache = this.getImageCache();
    const cleanKey = key.trim();
    const existing: Partial<CachedFoodImage> = cache[cleanKey] || {};

    const updated: CachedFoodImage = {
      canonicalId: data.canonicalId || existing.canonicalId || cleanKey,
      validatedUrl: data.validatedUrl || existing.validatedUrl || '',
      imageHash: data.imageHash || existing.imageHash || computeImageHash(data.validatedUrl || existing.validatedUrl || ''),
      virtualPhotoUrl: data.virtualPhotoUrl || existing.virtualPhotoUrl,
      virtualPhotoTheme: data.virtualPhotoTheme || existing.virtualPhotoTheme || 'golden_kitchen',
      isVerified: data.isVerified !== undefined ? data.isVerified : (existing.isVerified ?? true),
      cachedAt: existing.cachedAt || Date.now(),
      lastAccessedAt: Date.now(),
      viewCount: (existing.viewCount || 0) + 1,
    };

    cache[cleanKey] = updated;
    if (data.canonicalId && data.canonicalId !== cleanKey) {
      cache[data.canonicalId] = updated;
    }

    StorageAdapter.setItem(STORAGE_KEYS.FOOD_IMAGE_CACHE, cache);
  }

  /**
   * Generates, caches, and returns a procedural Virtual Photo for any dish
   */
  static generateAndCacheVirtualPhoto(recipe: Partial<Recipe> & { group?: string }, theme: VirtualPhotoTheme = 'golden_kitchen'): string {
    const canonicalId = (recipe as any).canonicalId || getRecipeCanonicalId({
      id: recipe.id,
      title: recipe.title,
      category: recipe.category,
    });

    const virtualUrl = generateVirtualFoodPhoto({
      dishTitle: recipe.title || 'أكلة مصرية',
      category: recipe.category,
      group: (recipe as any).group,
      theme,
    });

    this.setCachedImage(canonicalId, {
      canonicalId,
      virtualPhotoUrl: virtualUrl,
      virtualPhotoTheme: theme,
    });

    return virtualUrl;
  }

  /**
   * Computes statistics regarding localStorage image caching performance
   */
  static getCacheStats(): CacheStats {
    const cache = this.getImageCache();
    const keys = Object.keys(cache);
    const serialized = JSON.stringify(cache);
    const sizeBytes = new Blob([serialized]).size;
    const virtualPhotosCount = keys.filter(k => !!cache[k]?.virtualPhotoUrl).length;
    const verifiedCount = keys.filter(k => !!cache[k]?.isVerified).length;

    return {
      count: keys.length,
      totalCached: keys.length,
      sizeBytes,
      virtualPhotosCount,
      verifiedCount,
      keys,
    };
  }

  /**
   * Clears all cached food images from localStorage
   */
  static clearImageCache(): void {
    StorageAdapter.setItem(STORAGE_KEYS.FOOD_IMAGE_CACHE, {});
  }

  /**
   * Pre-populates the cache with all catalog dishes for lightning fast zero-latency loads
   */
  static preloadAndCacheImages(recipes: (Partial<Recipe> & { group?: string })[]): void {
    const cache = this.getImageCache();
    let modified = false;

    recipes.forEach((recipe) => {
      const canonicalId = (recipe as any).canonicalId || getRecipeCanonicalId({
        id: recipe.id,
        title: recipe.title,
        category: recipe.category,
      });

      if (!cache[canonicalId]) {
        const val = validateRecipeImage({
          id: recipe.id,
          canonicalId,
          title: recipe.title,
          image: recipe.image,
          category: recipe.category,
        });

        const virt = generateVirtualFoodPhoto({
          dishTitle: recipe.title || 'أكلة مصرية',
          category: recipe.category,
          group: (recipe as any).group,
          theme: 'golden_kitchen',
        });

        cache[canonicalId] = {
          canonicalId,
          validatedUrl: val.validatedUrl,
          imageHash: val.imageHash,
          virtualPhotoUrl: virt,
          virtualPhotoTheme: 'golden_kitchen',
          isVerified: val.isVerified,
          cachedAt: Date.now(),
          lastAccessedAt: Date.now(),
          viewCount: 1,
        };
        modified = true;
      }
    });

    if (modified) {
      StorageAdapter.setItem(STORAGE_KEYS.FOOD_IMAGE_CACHE, cache);
    }
  }

  /**
   * Sanitizes and validates a recipe before storage or rendering:
   * 1. Checks localStorage cache for cached verified URL & virtual photo.
   * 2. If not found, runs validateRecipeImage and stores in cache.
   * 3. Guarantees canonicalId, imageHash, and virtual photo availability.
   */
  static sanitizeRecipe(recipe: Recipe & { group?: string }): Recipe {
    const canonicalId = (recipe as any).canonicalId || getRecipeCanonicalId({
      id: recipe.id,
      title: recipe.title,
      category: recipe.category,
    });

    // Check localStorage cache first
    const cached = this.getCachedImage(canonicalId) || (recipe.id ? this.getCachedImage(recipe.id) : null);
    if (cached && cached.validatedUrl) {
      return {
        ...recipe,
        canonicalId,
        image: cached.validatedUrl,
        imageHash: cached.imageHash,
        virtualPhoto: cached.virtualPhotoUrl,
      } as Recipe & { virtualPhoto?: string };
    }

    // Otherwise compute validation and cache it
    const validation = validateRecipeImage({
      id: recipe.id,
      canonicalId,
      title: recipe.title,
      image: recipe.image,
      category: recipe.category,
    });

    const virtualPhotoUrl = generateVirtualFoodPhoto({
      dishTitle: recipe.title || 'أكلة مصرية',
      category: recipe.category,
      group: (recipe as any).group,
      theme: 'golden_kitchen',
    });

    this.setCachedImage(canonicalId, {
      canonicalId,
      validatedUrl: validation.validatedUrl,
      imageHash: validation.imageHash,
      virtualPhotoUrl,
      isVerified: validation.isVerified,
    });

    return {
      ...recipe,
      canonicalId,
      image: validation.validatedUrl,
      imageHash: validation.imageHash,
      virtualPhoto: virtualPhotoUrl,
    } as Recipe & { virtualPhoto?: string };
  }

  // Recipes
  static getRecipes(): Recipe[] {
    const stored = StorageAdapter.getItem<Recipe[]>(STORAGE_KEYS.RECIPES, []);
    const base = stored.length ? stored : DEFAULT_RECIPES;
    const existing = new Set(base.map(r => r.id));
    const merged = [...base, ...FOOD_CATALOG.filter(r => !existing.has(r.id))];

    // Sanitize and validate image fidelity for all recipes using cache
    let hasModifications = false;
    const sanitized = merged.map(r => {
      const clean = this.sanitizeRecipe(r);
      if (clean.image !== r.image || (clean as any).canonicalId !== (r as any).canonicalId) {
        hasModifications = true;
      }
      return clean;
    });

    if (hasModifications || merged.length !== stored.length) {
      StorageAdapter.setItem(STORAGE_KEYS.RECIPES, sanitized);
    }

    return sanitized;
  }

  static saveRecipes(recipes: Recipe[]): void {
    const sanitized = recipes.map(r => this.sanitizeRecipe(r));
    StorageAdapter.setItem(STORAGE_KEYS.RECIPES, sanitized);
  }

  static addRecipe(recipe: Recipe): Recipe[] {
    const list = this.getRecipes();
    const clean = this.sanitizeRecipe(recipe);
    const updated = [clean, ...list];
    this.saveRecipes(updated);
    return updated;
  }

  static updateRecipe(recipe: Recipe): Recipe[] {
    const list = this.getRecipes();
    const clean = this.sanitizeRecipe(recipe);
    const updated = list.map((r) => (r.id === recipe.id ? clean : r));
    this.saveRecipes(updated);
    return updated;
  }

  static deleteRecipe(id: string): Recipe[] {
    const list = this.getRecipes();
    const updated = list.filter((r) => r.id !== id);
    this.saveRecipes(updated);
    return updated;
  }

  static validateRecipeImage(recipe: Partial<Recipe>) {
    return validateRecipeImage(recipe as any);
  }

  // Shopping List
  static getShoppingList(): ShoppingItem[] {
    return StorageAdapter.getItem<ShoppingItem[]>(STORAGE_KEYS.SHOPPING_LIST, DEFAULT_SHOPPING_ITEMS);
  }

  static saveShoppingList(items: ShoppingItem[]): void {
    StorageAdapter.setItem(STORAGE_KEYS.SHOPPING_LIST, items);
  }

  static addShoppingItem(item: ShoppingItem): ShoppingItem[] {
    const list = this.getShoppingList();
    const updated = [item, ...list];
    this.saveShoppingList(updated);
    return updated;
  }

  static addShoppingItems(items: ShoppingItem[]): ShoppingItem[] {
    const list = this.getShoppingList();
    const updated = [...items, ...list];
    this.saveShoppingList(updated);
    return updated;
  }

  static toggleShoppingItem(id: string): ShoppingItem[] {
    const list = this.getShoppingList();
    const updated = list.map((i) => (i.id === id ? { ...i, isCompleted: !i.isCompleted } : i));
    this.saveShoppingList(updated);
    return updated;
  }

  static deleteShoppingItem(id: string): ShoppingItem[] {
    const list = this.getShoppingList();
    const updated = list.filter((i) => i.id !== id);
    this.saveShoppingList(updated);
    return updated;
  }
}
