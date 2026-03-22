import type { MenuCategory, MenuItem } from '@sugarstack/shared';
import type { IMenuRepository } from '@/core/domain/repositories/IMenuRepository';
import { apiClient } from './http.client';

class MenuRepository implements IMenuRepository {
  async getCategories(): Promise<MenuCategory[]> {
    return apiClient<MenuCategory[]>('/menu/categories');
  }

  async getItems(categorySlug?: string): Promise<MenuItem[]> {
    const query = categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : '';
    return apiClient<MenuItem[]>(`/menu/items${query}`);
  }

  async getItemById(id: string): Promise<MenuItem | null> {
    try {
      return await apiClient<MenuItem>(`/menu/items/${id}`);
    } catch {
      return null;
    }
  }
}

export const menuRepository = new MenuRepository();
