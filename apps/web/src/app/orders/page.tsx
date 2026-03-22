'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { orderRepository } from '@/core/infrastructure/api/order.repository';
import type { Order, OrderStatus } from '@sugarstack/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RefreshCw, ArrowLeft } from 'lucide-react';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; emoji: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', emoji: '⏳' },
  preparing: { label: 'Preparing', color: 'bg-blue-100 text-blue-700', emoji: '👨‍🍳' },
  ready: { label: 'Ready!', color: 'bg-green-100 text-green-700', emoji: '✅' },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-500', emoji: '🎉' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-500', emoji: '❌' },
};

export default function OrdersPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchOrders() {
    if (!token) return;
    try {
      const data = await orderRepository.getOrders(token);
      setOrders(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!token) { router.push('/auth/login'); return; }
    fetchOrders();
    const interval = setInterval(fetchOrders, 20_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function handleRefresh() {
    setRefreshing(true);
    fetchOrders();
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-pink-100 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/menu"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
          <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
          ))
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🛍</p>
            <p className="text-gray-500 font-medium">No orders yet</p>
            <Link href="/menu" className="inline-block mt-4 px-5 py-2 bg-pink-500 text-white rounded-2xl text-sm font-semibold hover:bg-pink-600 transition-colors">
              Start Ordering
            </Link>
          </div>
        ) : (
          orders.map(order => {
            const cfg = STATUS_CONFIG[order.status];
            return (
              <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cfg.emoji}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <span className="font-bold text-pink-600 text-lg">${Number(order.totalAmount).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Order #{order.id.slice(0, 8).toUpperCase()}</span>
                  <span>{new Date(order.createdAt).toLocaleString()}</span>
                </div>
                {order.tableId && (
                  <div className="mt-1.5 text-xs text-gray-400">📍 {order.tableId}</div>
                )}
                {/* Progress bar */}
                <div className="mt-3 flex gap-1">
                  {(['pending', 'preparing', 'ready', 'completed'] as OrderStatus[]).map((s, i) => {
                    const steps: OrderStatus[] = ['pending', 'preparing', 'ready', 'completed'];
                    const currentIdx = steps.indexOf(order.status);
                    const isActive = i <= currentIdx && order.status !== 'cancelled';
                    return (
                      <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${isActive ? 'bg-pink-400' : 'bg-gray-100'}`} />
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
