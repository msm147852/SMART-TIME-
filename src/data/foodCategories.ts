import { FoodDish, EGYPTIAN_DISHES } from './egyptianDishes';

export interface FoodCategory {
  id: 'egyptian-meals' | 'egyptian-sweets';
  title: string;
  icon: string;
  dishes: FoodDish[];
}

export const FOOD_CATEGORIES: FoodCategory[] = [
  { id: 'egyptian-meals', title: 'الأكلات المصرية', icon: '🍲', dishes: EGYPTIAN_DISHES.filter(d => d.category === 'meal') },
  { id: 'egyptian-sweets', title: 'الحلويات المصرية', icon: '🍮', dishes: EGYPTIAN_DISHES.filter(d => d.category === 'dessert') },
];
