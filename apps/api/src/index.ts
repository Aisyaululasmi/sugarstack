import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '../../.env') });
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';

import { authRoutes } from './routes/auth.routes';
import { menuRoutes } from './routes/menu.routes';
import { orderRoutes } from './routes/order.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const PORT = process.env.PORT ?? process.env.API_PORT ?? 4000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : null; // null = allow all origins when env var is not set

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // allow no-origin requests (server-to-server, curl)
    if (!origin) return callback(null, true);
    // if ALLOWED_ORIGINS is not configured, allow all origins
    if (!allowedOrigins) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: '10kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

async function waitForDatabase(retries = 10, delayMs = 3000): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  for (let i = 1; i <= retries; i++) {
    try {
      await pool.query('SELECT 1');
      await pool.end();
      console.log('✅ Database connected');
      return;
    } catch (err) {
      console.log(`⏳ Waiting for database... (${i}/${retries})`);
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

async function start() {
  try {
    await waitForDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 SugarStack API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to database:', err);
    process.exit(1);
  }
}

start();
export default app;
