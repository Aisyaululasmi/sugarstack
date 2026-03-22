import type { Order, CreateOrderRequest } from '@sugarstack/shared';
import type { IOrderRepository } from '@/core/domain/repositories/IOrderRepository';
import { apiClient } from './http.client';

class OrderRepository implements IOrderRepository {
  async createOrder(request: CreateOrderRequest, token: string): Promise<Order> {
    return apiClient<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(request),
      token,
    });
  }

  async getOrders(token: string): Promise<Order[]> {
    return apiClient<Order[]>('/orders', { token });
  }

  async getOrderById(id: string, token: string): Promise<Order | null> {
    try {
      return await apiClient<Order>(`/orders/${id}`, { token });
    } catch {
      return null;
    }
  }

  async updateStatus(id: string, status: string, token: string): Promise<Order> {
    return apiClient<Order>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      token,
    });
  }
}

export const orderRepository = new OrderRepository();
