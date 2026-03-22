import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import type { MenuItem, MenuCategory } from '@sugarstack/shared';

export const menuRoutes = Router();

// GET /api/menu/categories
menuRoutes.get('/categories', async (_req, res: Response, next: NextFunction) => {
  try {
    const result = await db.query<MenuCategory>(
      `SELECT id, name, slug, description, image_url as "imageUrl", sort_order as "sortOrder"
       FROM menu_categories ORDER BY sort_order ASC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

// GET /api/menu/items
menuRoutes.get('/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categorySlug = req.query.category as string | undefined;
    let query = `
      SELECT mi.id, mi.category_id as "categoryId", mi.name, mi.description,
             mi.price, mi.image_url as "imageUrl", mi.is_available as "isAvailable",
             mi.allergens, mi.tags, mi.created_at as "createdAt"
      FROM menu_items mi
      JOIN menu_categories mc ON mi.category_id = mc.id
    `;
    const params: unknown[] = [];

    if (categorySlug) {
      query += ` WHERE mc.slug = $1`;
      params.push(categorySlug);
    }
    query += ` ORDER BY mi.name ASC`;

    const result = await db.query<MenuItem>(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

// GET /api/menu/items/:id
menuRoutes.get('/items/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await db.query<MenuItem>(
      `SELECT id, category_id as "categoryId", name, description, price,
              image_url as "imageUrl", is_available as "isAvailable",
              allergens, tags, created_at as "createdAt"
       FROM menu_items WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) throw new AppError(404, 'Menu item not found');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

// PATCH /api/menu/items/:id/availability — staff/admin only
menuRoutes.patch(
  '/items/:id/availability',
  authenticate,
  requireRole('staff', 'admin'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const schema = z.object({ isAvailable: z.boolean() });
      const { isAvailable } = schema.parse(req.body);

      const result = await db.query<MenuItem>(
        `UPDATE menu_items SET is_available = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, is_available as "isAvailable"`,
        [isAvailable, req.params.id]
      );
      if (!result.rows[0]) throw new AppError(404, 'Menu item not found');
      res.json({ success: true, data: result.rows[0] });
    } catch (err) { next(err); }
  }
);
