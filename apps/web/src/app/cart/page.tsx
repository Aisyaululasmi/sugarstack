'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { orderRepository } from '@/core/infrastructure/api/order.repository';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart, totalAmount, totalItems } = useCartStore();
  const { token } = useAuthStore();
  const [tableId, setTableId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCheckout() {
    if (!token) { router.push('/auth/login'); return; }
    if (items.length === 0) return;
    setLoading(true);
    setError('');
    try {
      await orderRepository.createOrder({
        tableId: tableId.trim() || undefined,
        items: items.map(i => ({
          menuItemId: i.menuItem.id,
          quantity: i.quantity,
          notes: i.notes,
        })),
      }, token);
      clearCart();
      router.push('/orders');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-amber-50">
        <ShoppingBag className="w-16 h-16 text-pink-200" />
        <p className="text-gray-500 text-lg font-medium">Your cart is empty</p>
        <Link href="/menu" className="px-6 py-2.5 bg-pink-500 text-white rounded-2xl font-semibold hover:bg-pink-600 transition-colors">
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 pb-36">
      <header className="bg-white border-b border-pink-100 px-4 py-4 flex items-center gap-3">
        <Link href="/menu"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Your Cart</h1>
          <p className="text-sm text-gray-400">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-3">
        {/* Table ID */}
        <div className="bg-white rounded-2xl p-4 border-2 border-dashed border-pink-200">
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">📍 Table Number <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            value={tableId}
            onChange={e => setTableId(e.target.value)}
            placeholder="e.g. Table 5, Bar Seat 2..."
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
        </div>

        {/* Cart items */}
        {items.map(item => (
          <div key={item.menuItem.id} className="bg-white rounded-2xl p-4 flex gap-3 items-center shadow-sm">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-amber-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">
              🍰
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{item.menuItem.name}</p>
              <p className="text-pink-600 font-bold text-sm">${(Number(item.menuItem.price) * item.quantity).toFixed(2)}</p>
              <p className="text-gray-400 text-xs">${Number(item.menuItem.price).toFixed(2)} each</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-pink-100 transition-colors">
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-bold w-5 text-center text-sm">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-pink-100 transition-colors">
                <Plus className="w-3 h-3" />
              </button>
              <button onClick={() => removeItem(item.menuItem.id)} className="ml-1 text-gray-300 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Checkout bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Subtotal ({totalItems} items)</span>
          <span className="font-semibold text-gray-900">${totalAmount.toFixed(2)}</span>
        </div>
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-3.5 bg-pink-500 text-white rounded-2xl font-bold hover:bg-pink-600 transition-colors disabled:opacity-60 shadow-lg shadow-pink-200"
        >
          {loading ? 'Placing Order...' : `Place Order · $${totalAmount.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
