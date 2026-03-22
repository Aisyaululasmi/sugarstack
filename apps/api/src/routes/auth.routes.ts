import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db';
import { AppError } from '../middleware/error.middleware';
import type { User } from '@sugarstack/shared';

export const authRoutes = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRoutes.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(body.password, 12);

    const result = await db.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, role, created_at as "createdAt"`,
      [body.email, passwordHash, body.name]
    );

    const user = result.rows[0] as unknown as User;
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as any }
    );

    res.status(201).json({ success: true, data: { token, user } });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      next(new AppError(400, err.errors[0].message));
    } else if ((err as { code?: string }).code === '23505') {
      next(new AppError(409, 'Email already registered'));
    } else {
      next(err);
    }
  }
});

authRoutes.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = loginSchema.parse(req.body);

    const result = await db.query(
      `SELECT id, email, name, role, password_hash, created_at as "createdAt"
       FROM users WHERE email = $1`,
      [body.email]
    );

    const user = result.rows[0] as unknown as (User & { password_hash: string }) | undefined;
    if (!user) throw new AppError(401, 'Invalid credentials');

    const valid = await bcrypt.compare(body.password, user.password_hash);
    if (!valid) throw new AppError(401, 'Invalid credentials');

    const { password_hash: _, ...safeUser } = user;
    const token = jwt.sign(
      { userId: safeUser.id, email: safeUser.email, role: safeUser.role },
      process.env.JWT_SECRET!,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as any }
    );

    res.json({ success: true, data: { token, user: safeUser } });
  } catch (err) {
    if (err instanceof z.ZodError) next(new AppError(400, err.errors[0].message));
    else next(err);
  }
});

authRoutes.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw new AppError(401, 'No token provided');

    const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET!) as { userId: string };
    const result = await db.query(
      `SELECT id, email, name, role, created_at as "createdAt" FROM users WHERE id = $1`,
      [payload.userId]
    );

    if (!result.rows[0]) throw new AppError(404, 'User not found');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});
