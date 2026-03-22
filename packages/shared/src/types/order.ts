export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface Order {
  id: string;
  userId: string;
  tableId?: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  tableId?: string;
  items: {
    menuItemId: string;
    quantity: number;
    notes?: string;
  }[];
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}
