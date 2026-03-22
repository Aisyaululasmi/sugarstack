# SugarStack Deployment Guide

## Local Development

### Prerequisites
- Node.js 20+
- Docker Desktop (for PostgreSQL)

### Steps
1. `cp .env.example .env` (edit secrets as needed)
2. `docker-compose up -d postgres`
3. `npm install`
4. `npm run dev`

- Web: http://localhost:3000
- API: http://localhost:4000
- Kitchen: http://localhost:3000/kitchen (staff role required)

---

## Production Deployment

### Option A: Vercel (Web) + Railway (API + DB)

#### Database → Railway
1. Create project on railway.app
2. Add PostgreSQL service
3. Copy `DATABASE_URL` from Railway dashboard
4. Run schema: paste `apps/api/src/db/schema.sql` in Railway's query editor

#### API → Railway
1. Add a new service → "Deploy from GitHub repo"
2. Set root directory to `apps/api`
3. Set build command: `npm install && npm run build`
4. Set start command: `node dist/index.js`
5. Set env vars:
   - `DATABASE_URL` (from Railway postgres)
   - `JWT_SECRET` (random 64-char string)
   - `ALLOWED_ORIGINS` = your Vercel domain, e.g. `https://sugarstack.vercel.app`
   - `NODE_ENV=production`

#### Web → Vercel
1. Import GitHub repo on vercel.com
2. Set root directory to `apps/web`
3. Set env vars:
   - `API_INTERNAL_URL` = your Railway API URL (e.g. `https://sugarstack-api.railway.app`)
4. Deploy

---

### Create Staff Account
After deployment, register normally then run this SQL to promote to staff:
```sql
UPDATE users SET role = 'staff' WHERE email = 'your@email.com';
```

### Default Seed Data
The schema auto-seeds:
- 4 categories: Cakes & Pastries, Drinks, Cookies, Specials
- 3 sample menu items
