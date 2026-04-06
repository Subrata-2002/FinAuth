# FinAuth — Financial Dashboard Backend

A role-based REST API for tracking company finances. Built with Node.js, Express.js, PostgreSQL (Sequelize), and Redis.

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

**Rate Limiting** — Upstash Redis using sliding window (5 req/15min for login, 100 req/min for API)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 4 |
| Database | PostgreSQL via Sequelize 6 |
| Auth | JWT (jsonwebtoken) |
| Rate Limiting | Upstash Redis (cloud-based rate limiting) |
| Validation | express-validator |
| Password hashing | bcryptjs (cost 12) |
| Financial math | big.js(no floating-point errors with money) |
| API Docs | Swagger UI (`/api/docs`) |
| Security | helmet, compression |

---

## Project Structure
      If you open the project folder, here's what you'll find:
```
src/
├── app.js                    # The brain — starts the server, connects everything
├── config/
│   ├── database.js           # Sets up the PostgreSQL connection
│   ├── redis.js              # Sets up the Redis connection for rate limiting
│   ├── seed.js               # Auto-creates default roles and admin user
│   └── swagger.js            # Generates the interactive API docs
├── models/
│   ├── index.js              # Links tables together
│   ├── Role.js               # Permission definitions
│   ├── User.js               # User accounts
│   └── Transaction.js        # Individual transactions (income/expense)
├── controllers/              # Reads incoming requests, calls business logic, sends responses
├── services/                 # Where the actual business logic lives
├── routes/                   # Maps URLs to controllers
└── middleware/
    ├── authMiddleware.js     # Checks if login token is valid
    ├── rbacMiddleware.js     # Checks if user has permission for this action
    ├── rateLimitMiddleware.js# Blocks spam and abuse
    └── errorHandler.js       # Catches and formats all errors nicely
```

---

## Roles & Permissions

| Role | What they can do |
|---|---|
| Viewer | Can see all Dashboard details |
| Analyst | Everything above + category breakdowns + monthly trends + read records |
| Admin | Everything — create/read/edit/delete records, manage users, change roles |

Self-registration always produces a `Viewer`. The only Admin is seeded from `.env` on startup — there is no way to self-register as Admin.

---

## Getting It Running Locally

### Prerequisites

- Node.js version 18 or newer
- PostgreSQL running on your machine (or a DATABASE_URL connection string)
- Upstash Redis — a free cloud Redis database

### Step 1: Download and install

```bash
git clone https://github.com/your-username/finauth.git
cd finauth
npm install
```

### Step 2: Create your .env file

At the root of the project, create a file called .env and paste this in (fill in the blanks):

```env
NODE_ENV=development
PORT=3000

# Database setup — use either DATABASE_URL OR the individual vars below
# If you have a cloud database URL, uncomment and use it instead
# DATABASE_URL=postgresql://user:password@host/dbname
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=fdb
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d

# The first admin account created automatically
ADMIN_EMAIL=
ADMIN_PASSWORD=

# Upstash Redis — get these from Upstash console
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here

# Rate limiting (these are the defaults, override as needed)
LOGIN_RATE_LIMIT_MAX=5
LOGIN_RATE_LIMIT_WINDOW=15 m
GENERAL_RATE_LIMIT_MAX=100
GENERAL_RATE_LIMIT_WINDOW=1 m
```

### Step 3: Start it up

```bash
# Development (auto-restarts + schema auto-sync)
npm run dev

# Production mode
npm start
```

When the server starts for the first time, it will automatically:

- Create the database tables
- Add the three roles (Admin, Analyst, Viewer)
- Create your admin account
- Start listening for requests on port 3000

No migration scripts needed—it just works.

---

## API Overview

Base URL: `http://localhost:3000/api`

For protected endpoints, you need to include your login token in the header:
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

---

## Rate Limiting

It uses cloud-based Redis to prevent abuse. Here's how it works:

| Route | Limit |
|---|---|
| `POST /api/auth/login` | 5 requests per 15 minutes |
| All `/api/*` routes | 100 requests per minute |

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
The system is designed to fail gracefully—if Redis goes down, requests still go through (the rate limiting just won't work temporarily).

---

## How the Database is Structured

Three main tables, all linked together:

```
Roles (1) ──< Users (many) ──< Transactions (many)
```

Why this design?

- UUIDs everywhere — No sequential IDs that could leak info about how many records exist
- Decimal amounts — Money is stored as DECIMAL(19,4) to avoid floating-point math errors (the classic 0.1 + 0.2 ≠ 0.3 problem)
- Soft deletes — When you delete a transaction, it's marked as deleted, not actually removed. This preserves an audit trail and prevents accidental data loss
- Simple categories — Transactions have a free-text category field (like "Office Supplies" or "Food") instead of a whole separate table
- Role permissions — Stored as JSON on each role, easy to update without a database migration

---

## Request Flow

```
Request arrives
    ↓
Security headers (helmet) + compression
    ↓
Rate limiter checks if you're not spamming
    ↓
Login check: is your token valid and is your account active?
    ↓
Permission check: do you have access to this action?
    ↓
Input validation: is the data formatted correctly?
    ↓
Controller reads the request
    ↓
Service layer runs the business logic
    ↓
Sequelize queries the database
    ↓
Response is formatted and sent back
    ↓
If anything breaks, the error handler catches it and sends a nice error message
```

---

## Live Deployment

The API is deployed on Render:

**Base URL:** `https://finauth-qu3g.onrender.com`

> Note: this runs on Render's free tier, To avoid cold-start delays on the free tier,I used UptimeRobot (free) to ping the API every 5 minutes. This keeps the instance warm and ready for instant responses.

![Render Deployment](./Img/render-deployment.png)

---

## Api Documentation (Swagger)

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
npm test       # jest 
```
