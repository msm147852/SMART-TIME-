import { Recipe, ShoppingItem } from '../../types';
import { STORAGE_KEYS } from '../storageKeys';
import { StorageAdapter } from '../storageAdapter';
import { DEFAULT_RECIPES, DEFAULT_SHOPPING_ITEMS } from '../seedData';

export class FoodRepository {
  // Recipes
  static getRecipes(): Recipe[] {
    return StorageAdapter.getItem<Recipe[]>(STORAGE_KEYS.RECIPES, DEFAULT_RECIPES);
  }

  static saveRecipes(recipes: Recipe[]): void {
    StorageAdapter.setItem(STORAGE_KEYS.RECIPES, recipes);
  }

  static addRecipe(recipe: Recipe): Recipe[] {
    const list = this.getRecipes();
    const updated = [recipe, ...list];
    this.saveRecipes(updated);
    return updated;
  }

  static updateRecipe(recipe: Recipe): Recipe[] {
    const list = this.getRecipes();
    const updated = list.map((r) => (r.id === recipe.id ? recipe : r));
    this.saveRecipes(updated);
    return updated;
  }

  static deleteRecipe(id: string): Recipe[] {
    const list = this.getRecipes();
    const updated = list.filter((r) => r.id !== id);
    this.saveRecipes(updated);
    return updated;
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
