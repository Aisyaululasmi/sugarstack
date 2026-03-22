import { Pool } from 'pg';

let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    _pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }
  return _pool;
}

export const db = {
  query: <T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    params?: unknown[]
  ) => getPool().query<T>(text, params),
  getClient: () => getPool().connect(),
};

export default { getPool };
