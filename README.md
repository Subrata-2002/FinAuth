# FinAuth — Financial Dashboard Backend

A role-based REST API for tracking company finances. Built with Node.js, Express, PostgreSQL (Sequelize), and Upstash Redis.

---
## 📌 Overview

- Track income & expenses
- Manage users with role-based access (Admin, Analyst, Viewer)
- Real-time financial insights and dashboards
- Secure authentication and rate limiting

---

## ✨ Core Features

**Authentication** — JWT tokens with 7-day expiration, bcrypt password hashing

**RBAC** — Three roles (Viewer, Analyst, Admin) with permission-based access control

**Financial Records** — Create/update/delete transactions with soft deletes, DECIMAL(19,4) precision

**Dashboard** — Summary, category breakdown, monthly trends, recent transactions

**Rate Limiting** — Upstash Redis sliding window (5 req/15min for login, 100 req/min for API)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 4 |
| Database | PostgreSQL via Sequelize 6 |
| Auth | JWT (jsonwebtoken) |
| Rate Limiting | Upstash Redis (`@upstash/ratelimit`) |
| Validation | express-validator |
| Password hashing | bcryptjs (cost 12) |
| Financial math | big.js |
| API Docs | Swagger UI (`/api/docs`) |
| Security | helmet, compression |

---

## Project Structure

```
src/
├── app.js                    # Entry point — wires middleware, mounts routes, boots server
├── config/
│   ├── database.js           # Sequelize instance (supports DATABASE_URL or individual vars)
│   ├── redis.js              # Upstash Redis client
│   ├── seed.js               # Idempotent role + admin user seeding
│   └── swagger.js            # Swagger spec config
├── models/
│   ├── index.js              # Associations registered centrally
│   ├── Role.js
│   ├── User.js
│   └── Transaction.js
├── controllers/              # HTTP layer — reads input, calls service, shapes response
├── services/                 # Business logic + all DB queries
├── routes/                   # Path definitions + middleware chaining
└── middleware/
    ├── authMiddleware.js     # JWT verification + active status check
    ├── rbacMiddleware.js     # Permission-based access control
    ├── rateLimitMiddleware.js# Upstash sliding-window rate limiter factory
    └── errorHandler.js       # Global error handler + express-validator helper
```

---

## Roles & Permissions

| Role | What they can do |
|---|---|
| Viewer | Dashboard summary + recent transactions only |
| Analyst | Everything above + category breakdowns + monthly trends + read records |
| Admin | Everything — create/read/edit/delete records, manage users, change roles |

Self-registration always produces a `Viewer`. The only Admin is seeded from `.env` on startup — there is no way to self-register as Admin.

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a `DATABASE_URL`)
- An [Upstash Redis](https://console.upstash.com) database (free tier works)

### 1. Clone and install

```bash
git clone https://github.com/your-username/finauth.git
cd finauth
npm install
```

### 2. Configure environment

Copy the example below into a `.env` file at the project root:

```env
NODE_ENV=development
PORT=3000

# PostgreSQL — use either DATABASE_URL or individual vars
# DATABASE_URL=postgresql://user:password@host/dbname
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=fdb
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d

# Admin user seeded on first boot
ADMIN_EMAIL=
ADMIN_PASSWORD=

# Upstash Redis — get these from console.upstash.com
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here

# Rate limiting (these are the defaults, override as needed)
LOGIN_RATE_LIMIT_MAX=5
LOGIN_RATE_LIMIT_WINDOW=15 m
GENERAL_RATE_LIMIT_MAX=100
GENERAL_RATE_LIMIT_WINDOW=1 m
```

### 3. Run

```bash
# Development (auto-restarts + schema auto-sync)
npm run dev

# Production
npm start
```

On first boot the server will:
1. Connect to PostgreSQL and sync all models
2. Seed the three roles (`Admin`, `Analyst`, `Viewer`) if they don't exist
3. Create the Admin user from `.env` if it doesn't exist
4. Start listening on `PORT`

No manual migration step needed.

---

## API Overview

Base URL: `http://localhost:3000/api`

All protected routes require:
```
Authorization: Bearer <jwt_token>
```

Every response follows this shape:
```json
{ "success": true, "message": "...", "data": { ... } }
```

### Endpoints

| Method | Path | Auth | Role |
|---|---|---|---|
| POST | `/auth/register` | No | — |
| POST | `/auth/login` | No | — |
| GET | `/users` | Yes | Admin |
| PATCH | `/users/:id/role` | Yes | Admin |
| PATCH | `/users/:id/status` | Yes | Admin |
| GET | `/records` | Yes | Analyst, Admin |
| POST | `/records` | Yes | Admin |
| PATCH | `/records/:id` | Yes | Admin |
| DELETE | `/records/:id` | Yes | Admin |
| GET | `/dashboard/summary` | Yes | All |
| GET | `/dashboard/recent` | Yes | All |
| GET | `/dashboard/by-category` | Yes | Analyst, Admin |
| GET | `/dashboard/trends` | Yes | Analyst, Admin |

Full request/response examples for every endpoint including all error cases are in [`TABLES/api_reference.md`](TABLES/api_reference.md).

---

## Rate Limiting

Backed by Upstash Redis using a sliding window algorithm. State persists across server restarts.

| Route | Limit |
|---|---|
| `POST /api/auth/login` | 5 requests per 15 minutes |
| All `/api/*` routes | 100 requests per minute |

Every response includes:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1718000000000
```

When the limit is exceeded:
```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "retryAfter": 42,
  "data": null
}
```

The middleware fails open — a Redis outage will not block traffic.

---

## Database Schema

Three tables:

```
Roles (1) ──< Users (many) ──< Transactions (many)
```

Key design decisions:
- UUID primary keys everywhere — no sequential IDs that leak record counts
- `amount` stored as `DECIMAL(19,4)` — avoids floating-point errors with money
- Transactions are soft-deleted (`is_deleted = true`) — data is never lost, audit trail is preserved
- `category` is a free-text field on `Transactions` — no separate category table needed
- Role permissions stored as a JSON array on the `Roles` table

Full schema with column types, constraints, and an ERD is in [`TABLES/schema.md`](TABLES/schema.md).

---

## Request Flow

```
Incoming request
      │
      ▼
helmet + compression
      │
      ▼
Rate limiter (Upstash Redis)
      │
      ▼
authMiddleware — verify JWT, load user, check status = active
      │
      ▼
rbacMiddleware — check role permissions
      │
      ▼
express-validator — validate input
      │
      ▼
Controller → Service → Sequelize → PostgreSQL
      │
      ▼
{ success, message, data }
      │
      ▼
globalErrorHandler — catches anything thrown, formats consistently
```

---

## Live Deployment

The API is deployed on Render:

**Base URL:** `https://finauth-qu3g.onrender.com`

> Note: this runs on Render's free tier, so the instance spins down after inactivity. The first request after a cold start may take 30–50 seconds. Subsequent requests are normal speed.

![Render Deployment](./Img/render-deployment.png)

---

## Interactive Docs (Swagger)

Two ways to access the Swagger UI:

**Deployed (recommended)** — fully functional, no local setup needed:
[https://finauth-qu3g.onrender.com/api/docs/#/](https://finauth-qu3g.onrender.com/api/docs/#/)

**Local** — available at `http://localhost:3000/api/docs` when running locally, but the server URL in the Swagger UI will point to `localhost`. If you're testing against the deployed API, use the deployed Swagger link above instead.

The Swagger UI covers all endpoints with request/response schemas and lets you authorize with a JWT token via the **Authorize** button (top right).

![Swagger UI](./Img/swagger-preview.png)

---

## Scripts

```bash
npm run dev    # nodemon — auto-restart on file changes
npm start      # production start
npm test       # jest --runInBand --forceExit
```
