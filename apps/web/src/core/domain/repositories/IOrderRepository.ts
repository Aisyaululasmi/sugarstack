import type { Order, CreateOrderRequest } from '@sugarstack/shared';

export interface IOrderRepository {
  createOrder(request: CreateOrderRequest, token: string): Promise<Order>;
  getOrders(token: string): Promise<Order[]>;
  getOrderById(id: string, token: string): Promise<Order | null>;
  updateStatus(id: string, status: string, token: string): Promise<Order>;
}
