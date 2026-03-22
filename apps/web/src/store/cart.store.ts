import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, MenuItem } from '@sugarstack/shared';

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  addItem: (menuItem: MenuItem, quantity?: number) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
}

function computeTotals(items: CartItem[]) {
  return {
    totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
    totalAmount: items.reduce((sum, i) => sum + Number(i.menuItem.price) * i.quantity, 0),
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      totalItems: 0,
      totalAmount: 0,

      addItem: (menuItem, quantity = 1) =>
        set(state => {
          const existing = state.items.find(i => i.menuItem.id === menuItem.id);
          const items = existing
            ? state.items.map(i =>
                i.menuItem.id === menuItem.id ? { ...i, quantity: i.quantity + quantity } : i
              )
            : [...state.items, { menuItem, quantity }];
          return { items, ...computeTotals(items) };
        }),

      removeItem: (menuItemId) =>
        set(state => {
          const items = state.items.filter(i => i.menuItem.id !== menuItemId);
          return { items, ...computeTotals(items) };
        }),

      updateQuantity: (menuItemId, quantity) =>
        set(state => {
          const items = quantity <= 0
            ? state.items.filter(i => i.menuItem.id !== menuItemId)
            : state.items.map(i => i.menuItem.id === menuItemId ? { ...i, quantity } : i);
          return { items, ...computeTotals(items) };
        }),

      clearCart: () => set({ items: [], totalItems: 0, totalAmount: 0 }),
    }),
    {
      name: 'sugarstack-cart',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') return localStorage;
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
    }
  )
);
