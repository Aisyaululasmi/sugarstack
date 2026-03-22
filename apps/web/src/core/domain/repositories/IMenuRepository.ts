import type { MenuCategory, MenuItem } from '@sugarstack/shared';

export interface IMenuRepository {
  getCategories(): Promise<MenuCategory[]>;
  getItems(categorySlug?: string): Promise<MenuItem[]>;
  getItemById(id: string): Promise<MenuItem | null>;
}
