'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { orderRepository } from '@/core/infrastructure/api/order.repository';
import type { Order, OrderStatus } from '@sugarstack/shared';
import { useRouter } from 'next/navigation';
import { RefreshCw, LogOut } from 'lucide-react';

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'preparing'];

export default function KitchenPage() {
  const router = useRouter();
  const { token, user, logout } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      const all = await orderRepository.getOrders(token);
      setOrders(all.filter(o => ACTIVE_STATUSES.includes(o.status)));
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token || (user?.role !== 'staff' && user?.role !== 'admin')) {
      router.push('/auth/login');
      return;
    }
    fetchOrders();
    const interval = setInterval(fetchOrders, 15_000);
    return () => clearInterval(interval);
  }, [token, user, fetchOrders, router]);

  async function updateStatus(orderId: string, status: OrderStatus) {
    if (!token) return;
    setUpdatingIds(prev => new Set(prev).add(orderId));
    try {
      await orderRepository.updateStatus(orderId, status, token);
      await fetchOrders();
    } finally {
      setUpdatingIds(prev => { const n = new Set(prev); n.delete(orderId); return n; });
    }
  }

  const pending = orders.filter(o => o.status === 'pending');
  const preparing = orders.filter(o => o.status === 'preparing');

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-pink-400">🍳 Kitchen Dashboard</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Last refresh: {lastRefresh.toLocaleTimeString()} · Auto-refreshes every 15s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchOrders} className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={() => { logout(); router.push('/'); }} className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
            <LogOut className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-500">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24 text-gray-600">
          <p className="text-5xl mb-4">✅</p>
          <p className="text-xl font-semibold">All caught up!</p>
          <p className="text-sm mt-1">No pending orders right now.</p>
        </div>
      ) : (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending column */}
          <div>
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              ⏳ New Orders
              <span className="bg-amber-400/20 text-amber-400 text-xs px-2 py-0.5 rounded-full">{pending.length}</span>
            </h2>
            <div className="space-y-3">
              {pending.map(order => (
                <OrderCard key={order.id} order={order} updating={updatingIds.has(order.id)} onAction={() => updateStatus(order.id, 'preparing')} onCancel={() => updateStatus(order.id, 'cancelled')} actionLabel="Claim Order" actionClass="bg-amber-500 hover:bg-amber-600" />
              ))}
              {pending.length === 0 && <p className="text-gray-600 text-sm">No new orders</p>}
            </div>
          </div>

          {/* Preparing column */}
          <div>
            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              👨‍🍳 In Progress
              <span className="bg-blue-400/20 text-blue-400 text-xs px-2 py-0.5 rounded-full">{preparing.length}</span>
            </h2>
            <div className="space-y-3">
              {preparing.map(order => (
                <OrderCard key={order.id} order={order} updating={updatingIds.has(order.id)} onAction={() => updateStatus(order.id, 'ready')} onCancel={() => updateStatus(order.id, 'cancelled')} actionLabel="Mark Ready ✓" actionClass="bg-green-600 hover:bg-green-700" />
              ))}
              {preparing.length === 0 && <p className="text-gray-600 text-sm">Nothing in progress</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, updating, onAction, onCancel, actionLabel, actionClass }: {
  order: Order;
  updating: boolean;
  onAction: () => void;
  onCancel: () => void;
  actionLabel: string;
  actionClass: string;
}) {
  const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);

  return (
    <div className={`rounded-2xl p-4 border ${order.status === 'pending' ? 'border-amber-500/30 bg-amber-500/5' : 'border-blue-500/30 bg-blue-500/5'}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-mono text-xs text-gray-500">#{order.id.slice(0, 8).toUpperCase()}</p>
          {order.tableId && <p className="font-bold text-white text-lg">📍 {order.tableId}</p>}
          <p className="text-gray-400 text-xs mt-0.5">
            {elapsed === 0 ? 'Just now' : `${elapsed}m ago`} · ${Number(order.totalAmount).toFixed(2)}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${elapsed >= 10 ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-300'}`}>
          {elapsed >= 10 ? `${elapsed}m ⚠️` : `${elapsed}m`}
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onAction}
          disabled={updating}
          className={`flex-1 py-2 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${actionClass}`}
        >
          {updating ? '...' : actionLabel}
        </button>
        <button
          onClick={onCancel}
          disabled={updating}
          className="px-3 py-2 bg-red-900/40 hover:bg-red-900/70 text-red-400 rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
