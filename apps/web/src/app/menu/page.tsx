'use client';

import { useEffect, useState } from 'react';
import { menuRepository } from '@/core/infrastructure/api/menu.repository';
import type { MenuCategory, MenuItem } from '@sugarstack/shared';
import { useCartStore } from '@/store/cart.store';
import { ShoppingCart, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function MenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem, totalItems } = useCartStore();

  useEffect(() => {
    menuRepository.getCategories()
      .then(cats => {
        setCategories(cats);
        if (cats.length > 0) setSelected(cats[0].slug);
      })
      .catch(() => {
        setError('Could not load menu. Please try again.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    menuRepository.getItems(selected)
      .then(its => { setItems(its); setLoading(false); })
      .catch(() => { setError('Could not load items.'); setLoading(false); });
  }, [selected]);

  const EMOJI_MAP: Record<string, string> = {
    'cakes-pastries': '🍰',
    'drinks': '🧋',
    'cookies': '🍪',
    'specials': '⭐',
  };

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-pink-100 px-4 py-4 flex items-center justify-between shadow-sm">
        <Link href="/" className="text-2xl font-bold text-pink-600">🍓 SugarStack</Link>
        <Link href="/cart" className="relative p-2">
          <ShoppingCart className="w-6 h-6 text-pink-600" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {totalItems}
            </span>
          )}
        </Link>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-400 text-white px-6 py-8">
        <h1 className="text-3xl font-bold">Our Menu</h1>
        <p className="text-pink-100 mt-1">Fresh baked with love every day ✨</p>
      </div>

      {/* Category tabs */}
      <div className="overflow-x-auto px-4 pt-5 pb-2 flex gap-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelected(cat.slug)}
            className={`whitespace-nowrap px-5 py-2 rounded-full font-medium text-sm transition-all ${
              selected === cat.slug
                ? 'bg-pink-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-pink-50 border border-gray-200'
            }`}
          >
            {EMOJI_MAP[cat.slug] ?? '🍽'} {cat.name}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Items grid */}
      <div className="px-4 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl h-64 animate-pulse" />
            ))
          : items.length === 0 && !error
          ? <p className="col-span-full text-center text-gray-400 py-12">No items in this category yet.</p>
          : items.map(item => (
              <div key={item.id} className="bg-white rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                <div className="h-40 bg-gradient-to-br from-pink-100 to-amber-100 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">
                  {EMOJI_MAP[selected ?? ''] ?? '🍰'}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 leading-tight">{item.name}</h3>
                    <span className="font-bold text-pink-600 shrink-0">${Number(item.price).toFixed(2)}</span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                  )}
                  {item.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {item.tags.map(tag => (
                        <span key={tag} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full capitalize">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    disabled={!item.isAvailable}
                    onClick={() => { addItem(item); }}
                    className="w-full mt-2 py-2.5 bg-pink-500 text-white rounded-2xl text-sm font-semibold hover:bg-pink-600 active:scale-95 transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {item.isAvailable ? '+ Add to Cart' : 'Currently Unavailable'}
                  </button>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
