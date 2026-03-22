import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import type { Order, OrderStatus } from '@sugarstack/shared';

export const orderRoutes = Router();

orderRoutes.use(authenticate);

const createOrderSchema = z.object({
  tableId: z.string().optional(),
  items: z.array(z.object({
    menuItemId: z.string().uuid(),
    quantity: z.number().int().positive(),
    notes: z.string().optional(),
  })).min(1),
});

// POST /api/orders
orderRoutes.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  const client = await db.getClient();
  try {
    const body = createOrderSchema.parse(req.body);
    await client.query('BEGIN');

    const itemIds = body.items.map(i => i.menuItemId);
    const menuResult = await client.query<{ id: string; price: string; is_available: boolean; name: string }>(
      `SELECT id, price, is_available, name FROM menu_items WHERE id = ANY($1::uuid[])`,
      [itemIds]
    );

    const menuMap = new Map(menuResult.rows.map(r => [r.id, r]));

    let totalAmount = 0;
    for (const item of body.items) {
      const menuItem = menuMap.get(item.menuItemId);
      if (!menuItem) throw new AppError(400, `Menu item not found`);
      if (!menuItem.is_available) throw new AppError(400, `"${menuItem.name}" is currently unavailable`);
      totalAmount += Number(menuItem.price) * item.quantity;
    }

    const orderResult = await client.query<{ id: string; status: string; total_amount: string; created_at: string }>(
      `INSERT INTO orders (user_id, table_id, total_amount)
       VALUES ($1, $2, $3)
       RETURNING id, status, total_amount, created_at`,
      [req.user!.userId, body.tableId ?? null, totalAmount]
    );
    const orderRow = orderResult.rows[0];

    for (const item of body.items) {
      const menuItem = menuMap.get(item.menuItemId)!;
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, menu_item_name, quantity, unit_price, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderRow.id, item.menuItemId, menuItem.name, item.quantity, menuItem.price, item.notes ?? null]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        id: orderRow.id,
        status: orderRow.status,
        totalAmount: Number(orderRow.total_amount),
        createdAt: orderRow.created_at,
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// GET /api/orders
orderRoutes.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isStaff = req.user!.role === 'staff' || req.user!.role === 'admin';

    const result = isStaff
      ? await db.query(
          `SELECT id, user_id as "userId", table_id as "tableId", status,
                  total_amount as "totalAmount", created_at as "createdAt", updated_at as "updatedAt"
           FROM orders ORDER BY created_at DESC`
        )
      : await db.query(
          `SELECT id, user_id as "userId", table_id as "tableId", status,
                  total_amount as "totalAmount", created_at as "createdAt", updated_at as "updatedAt"
           FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
          [req.user!.userId]
        );

    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

// GET /api/orders/:id
orderRoutes.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const orderResult = await db.query(
      `SELECT id, user_id as "userId", table_id as "tableId", status,
              total_amount as "totalAmount", created_at as "createdAt", updated_at as "updatedAt"
       FROM orders WHERE id = $1`,
      [req.params.id]
    );
    const order = orderResult.rows[0] as unknown as Order | undefined;
    if (!order) throw new AppError(404, 'Order not found');

    const isStaff = req.user!.role === 'staff' || req.user!.role === 'admin';
    if (!isStaff && order.userId !== req.user!.userId) throw new AppError(403, 'Forbidden');

    const itemsResult = await db.query(
      `SELECT id, order_id as "orderId", menu_item_id as "menuItemId",
              menu_item_name as "menuItemName", quantity, unit_price as "unitPrice", notes
       FROM order_items WHERE order_id = $1`,
      [order.id]
    );

    res.json({ success: true, data: { ...order, items: itemsResult.rows } });
  } catch (err) { next(err); }
});

// PATCH /api/orders/:id/status — staff/admin only
orderRoutes.patch(
  '/:id/status',
  requireRole('staff', 'admin'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const schema = z.object({
        status: z.enum(['pending', 'preparing', 'ready', 'completed', 'cancelled']),
      });
      const { status } = schema.parse(req.body);

      const result = await db.query(
        `UPDATE orders SET status = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, status, updated_at as "updatedAt"`,
        [status as OrderStatus, req.params.id]
      );
      if (!result.rows[0]) throw new AppError(404, 'Order not found');
      res.json({ success: true, data: result.rows[0] });
    } catch (err) { next(err); }
  }
);
