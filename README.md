# DSHub Graduation Showcase — Backend API

> REST API for the DSHub Cohort A 2026 Graduation Showcase.
> Built with Node.js, Express, and MongoDB.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Rate Limiting](#rate-limiting)
- [Roles & Permissions](#roles--permissions)
- [Database](#database)
- [Deployment](#deployment)
- [Scripts](#scripts)

---

## Overview

The DSHub Graduation Backend powers the Cohort A 2026 graduation showcase platform. It provides a secure REST API for managing intern profiles, testimonials, milestones, media uploads, and cohort analytics.

**SDG Alignment:** SDG 8 (Decent Work & Economic Growth) · SDG 9 (Industry, Innovation & Infrastructure)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ (ESM) |
| Framework | Express.js |
| Database | MongoDB (Mongoose ODM) — Atlas |
| Auth | JWT — access tokens (15min) + refresh tokens (7d) |
| Password Hashing | bcrypt (12 rounds) |
| File Uploads | Multer |
| Security | Helmet, express-mongo-sanitize, express-rate-limit, CORS |
| Documentation | Swagger UI (swagger-jsdoc + swagger-ui-express) |
| Logging | Morgan |
| Deployment | Render |

---

## Architecture

```
Request
  │
  ▼
Route          → applies middleware (protect, restrictTo, upload)
  │
  ▼
Controller     → parses req, calls service, sends response (HTTP only)
  │
  ▼
Service        → business logic, validation rules, AppError throws
  │
  ▼
Model          → Mongoose schema, DB queries, virtuals, hooks
  │
  ▼
MongoDB Atlas
```

### Layer Responsibilities

| Layer | Owns |
|---|---|
| **Route** | Middleware chain, HTTP method + path |
| **Controller** | req/res parsing, service calls, response sending |
| **Service** | Business rules, DB orchestration, error throwing |
| **Model** | Schema, indexes, virtuals, pre-save hooks |
| **Utils** | Shared helpers — JWT, response, OTP, pagination, storage |
| **Middleware** | Auth (protect, optionalAuth), RBAC (restrictTo, isSelfOrAdmin) |

---

## Project Structure

```
dshub-graduation-backend/
├── app.js                          # Express app — middleware, routes, error handlers
├── server.js                       # Entry point — DB connect, listen, graceful shutdown
├── package.json
├── .env                            # Environment variables (never commit)
├── .env.example                    # Environment variable template
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── README.md
├── logs/                           # HTTP request logs (gitignored — only .gitkeep committed)
│   ├── .gitkeep                    # Keeps folder tracked by Git so app can write logs on clone
│   ├── access.log                  # All requests (generated at runtime, not committed)
│   └── error.log                   # 4xx/5xx errors only (generated at runtime, not committed)
├── uploads/                        # Local file uploads (dev only — Cloudinary used in production)
└── src/
    ├── config/
    │   ├── db.js                   # MongoDB connection with retry logic
    │   ├── seed.js                 # Seeds admin, mentor accounts + milestones
    │   ├── cloudinary.js           # Cloudinary SDK configuration
    │   ├── multer.js               # Multer memoryStorage + MIME filter
    │   ├── rateLimiter.js          # Global, auth, and strict rate limiters
    │   └── swagger.js              # Swagger/OpenAPI 3.0 setup
    ├── models/
    │   ├── user.model.js           # Auth, RBAC, password hashing, JWT invalidation
    │   ├── intern.model.js         # Intern profiles, projects, achievements
    │   ├── testimonial.model.js    # Testimonials with moderation status
    │   ├── milestone.model.js      # Program timeline milestones
    │   ├── media.model.js          # Uploaded images and videos
    │   └── analytics.model.js      # Cohort analytics snapshots
    ├── services/
    │   ├── auth.service.js         # Register, login, token refresh, password flows
    │   ├── intern.service.js       # Intern CRUD, visibility, ownership
    │   ├── testimonial.service.js  # Submit, approve, feature business rules
    │   ├── milestone.service.js    # Milestone CRUD
    │   ├── media.service.js        # Upload, update, delete with storage abstraction
    │   └── analytics.service.js    # Snapshot generation, aggregation pipelines
    ├── jobs/
    │   └── analyticsJob.js         # Scheduled analytics snapshot (node-cron, hourly)
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── intern.controller.js
    │   ├── testimonial.controller.js
    │   ├── milestone.controller.js
    │   ├── media.controller.js
    │   └── analytics.controller.js
    ├── routes/
    │   ├── auth.route.js
    │   ├── intern.route.js
    │   ├── testimonial.route.js
    │   ├── milestone.route.js
    │   ├── media.route.js
    │   └── analytics.route.js
    ├── middlewares/
    │   ├── auth.middleware.js      # protect, optionalAuth — JWT verification
    │   ├── rbac.middleware.js      # restrictTo, isSelfOrAdmin, hasMinimumRole, isVerified
    │   └── errorHandler.js        # Global error handler + AppError class
    └── utils/
        ├── helpers.js             # parsePagination, buildFilter, pickFields, stripAdminFields
        ├── storage.helper.js      # File storage abstraction (local / cloudinary / s3)
        ├── jwt.js                 # signTokenPair, verifyAccessToken, extractBearerToken
        ├── response.js            # sendOk, sendCreated, sendError, buildPagination
        └── otp.js                 # generateOtpBundle, verifyOtp (timing-safe)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 8+
- MongoDB Atlas account (or local MongoDB)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/dshub-graduation-backend.git
cd dshub-graduation-backend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your values

# 4. Create required directories
# On Mac/Linux:
mkdir -p uploads logs && touch uploads/.gitkeep logs/.gitkeep
# On Windows (PowerShell):
New-Item -ItemType Directory -Force uploads, logs; New-Item uploads/.gitkeep, logs/.gitkeep -type file

# 5. Seed admin account and milestones
npm run seed

# 6. Start development server
npm run dev
```

| URL | Description |
|---|---|
| `http://localhost:9000/api/v1` | API base URL |
| `http://localhost:9000/api-docs` | Swagger UI |
| `http://localhost:9000/health` | Health check |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `9000` | Server port |
| `NODE_ENV` | Yes | `development` | `development` or `production` |
| `SERVER_URL` | Yes | — | Full API URL (used for file URLs + Swagger) |
| `FRONTEND_URL` | Yes | — | Frontend origin for CORS whitelist |
| `MONGODB_URI` | Yes | — | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | — | 64-char hex secret for access tokens |
| `JWT_EXPIRES_IN` | No | `15m` | Access token lifetime |
| `JWT_REFRESH_SECRET` | Yes | — | 64-char hex secret for refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token lifetime |
| `BCRYPT_ROUNDS` | No | `12` | bcrypt hashing rounds (min 10) |
| `MAX_FILE_SIZE_BYTES` | No | `10485760` | Max upload size in bytes (10MB) |
| `RATE_LIMIT_GLOBAL_MAX` | No | `100` | Global rate limit per 15 min |
| `RATE_LIMIT_AUTH_MAX` | No | `10` | Auth rate limit per 15 min |
| `RATE_LIMIT_STRICT_MAX` | No | `3` | Forgot-password limit per hour |
| `CURRENT_COHORT` | No | `Cohort A 2026` | Active cohort name |
| `ANALYTICS_STALE_MINUTES` | No | `60` | Minutes before snapshot is stale |
| `ANALYTICS_CRON_SCHEDULE` | No | `0 * * * *` | Cron schedule for auto-regeneration |
| `TZ` | No | `Africa/Lagos` | Timezone for cron job scheduler |
| `FRONTEND_URL` | Yes | — | Frontend origin for CORS (e.g. https://dshub-platform-sigma.vercel.app) |
| `CLOUDINARY_CLOUD_NAME` | Yes | — | Cloudinary cloud name from dashboard |
| `CLOUDINARY_API_KEY` | Yes | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | — | Cloudinary API secret |

> **Generate secure JWT secrets:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## API Documentation

Interactive Swagger UI:
```
http://localhost:9000/api-docs
```

Raw OpenAPI JSON (import into Postman):
```
http://localhost:9000/api-docs.json
```

### How to authenticate in Swagger UI
1. Call `POST /api/v1/auth/login`
2. Copy the `accessToken` from the response
3. Click **Authorize** at the top of the page
4. Enter: `Bearer <your_token>`
5. All protected endpoints are now unlocked

---

## API Endpoints

### Auth — `/api/v1/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register a new account |
| POST | `/login` | Public | Login + receive token pair |
| GET | `/me` | Protected | Get current user |
| POST | `/refresh-token` | Public | Rotate tokens |
| POST | `/forgot-password` | Public | Request password reset |
| POST | `/reset-password/:token` | Public | Reset password |
| POST | `/verify-email/:token` | Public | Verify email address |
| PATCH | `/update-password` | Protected | Change password |

### Interns — `/api/v1/interns`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List visible interns (paginated) |
| GET | `/:id` | Public | Single intern profile |
| GET | `/track/:track` | Public | Interns by track |
| POST | `/` | Admin | Create intern profile |
| PUT | `/:id` | Admin / Self | Update intern profile |
| DELETE | `/:id` | Admin | Soft delete (`?forceDelete=true` for hard delete) |

### Testimonials — `/api/v1/testimonials`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List approved testimonials |
| POST | `/` | Protected + Verified | Submit testimonial (one per user) |
| PUT | `/:id/approve` | Admin | Approve testimonial |
| PUT | `/:id/feature` | Admin | Toggle featured status |
| DELETE | `/:id` | Admin | Delete testimonial |

### Milestones — `/api/v1/milestones`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List all milestones (timeline order) |
| GET | `/:id` | Public | Single milestone |
| POST | `/` | Admin | Create milestone |
| PUT | `/:id` | Admin | Update milestone |
| DELETE | `/:id` | Admin | Delete milestone |

### Media — `/api/v1/media`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List public media |
| GET | `/:id` | Public | Single media item |
| POST | `/` | Admin | Upload file (multipart/form-data, field: `file`) |
| PUT | `/:id` | Admin | Update metadata |
| DELETE | `/:id` | Admin | Delete media + file from storage |

### Analytics — `/api/v1/analytics`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/cohort` | Public | Cohort overview stats |
| GET | `/tracks` | Public | Per-track breakdown |
| GET | `/dashboard` | Admin | Full analytics dashboard |
| GET | `/submissions` | Admin | Submission metrics + weekly activity |
| POST | `/regenerate` | Admin | Force fresh analytics snapshot |

### Health

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/health` | Public | Server health check |

---

## Authentication

```
1. POST /api/v1/auth/login
   → { accessToken, refreshToken, user }

2. Every protected request:
   Authorization: Bearer <accessToken>

3. On 401 (token expired — 15min):
   POST /api/v1/auth/refresh-token
   Body: { refreshToken }
   → { accessToken, refreshToken, user }
```

---

## Response Format

**Success:**
```json
{
  "success": true,
  "message": "Interns fetched successfully.",
  "data": { "interns": [] },
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 48,
    "limit": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Please provide a valid email address",
    "password": "Password must be at least 8 characters"
  }
}
```

---

## Rate Limiting

| Limiter | Limit | Applied To |
|---|---|---|
| Global | 100 req / 15 min | All routes |
| Auth | 10 req / 15 min | `/register`, `/login` |
| Strict | 3 req / 1 hour | `/forgot-password` |

---

## Roles & Permissions

| Role | Permissions |
|---|---|
| `intern` | Read public data · Submit testimonial · Edit own profile |
| `mentor` | Intern access · Approve testimonials |
| `admin` | Full access · User management · Analytics · Media upload |

---

## Database

**MongoDB Atlas** — hosted cluster.

### Collections

| Collection | Description |
|---|---|
| `users` | All platform accounts (admin, mentor, intern) |
| `interns` | Intern profiles — 1:1 with User |
| `testimonials` | Intern-submitted testimonials with moderation |
| `milestones` | Cohort A 2026 program timeline (9 weeks) |
| `media` | Uploaded images and videos |
| `analytics` | Cohort analytics snapshots |

### Seed

```bash
npm run seed     # Creates admin, mentor accounts + 9 milestones
npm run destroy  # Wipes all collections
```

**Seed credentials** (change immediately in production):
```
Admin:   admin@dshub.com   /  Admin@123456
Mentor:  mentor@dshub.com  /  Mentor@123456
```

### Post-seed workflow via Postman/Swagger
```
1. POST /api/v1/auth/login          → get admin token
2. POST /api/v1/auth/register       → create intern accounts
3. POST /api/v1/interns             → create intern profiles (as admin)
4. POST /api/v1/media               → upload showcase media (as admin)
5. POST /api/v1/testimonials        → interns submit testimonials
6. PUT  /api/v1/testimonials/:id/approve → admin approves
7. POST /api/v1/analytics/regenerate     → generate analytics snapshot
```

---

## Scheduled Jobs

The API runs one in-process scheduled job using `node-cron`.

### Analytics Snapshot Job

| Property | Value |
|---|---|
| File | `src/jobs/analyticsJob.js` |
| Default schedule | Every hour at `:00` (`0 * * * *`) |
| Timezone | `Africa/Lagos` (configurable via `TZ`) |
| Triggered by | `server.js` after DB connection |

The job calls `generateSnapshot()` which aggregates data across the `interns`, `testimonials` collections and upserts the `analytics` document for the current cohort.

**Customise the schedule via `.env`:**
```env
ANALYTICS_CRON_SCHEDULE=0 * * * *    # every hour (default)
ANALYTICS_CRON_SCHEDULE=0 */2 * * *  # every 2 hours
ANALYTICS_CRON_SCHEDULE=0 0 * * *    # once daily at midnight
```

> Reference: [crontab.guru](https://crontab.guru)

**Manual trigger (no need to wait for cron):**
```
POST /api/v1/analytics/regenerate   (Admin only)
```

---

## Deployment

**Platform:** Render

### Steps

1. Push code to GitHub
2. Create a **Web Service** on Render
3. Connect your GitHub repository
4. Set environment variables in Render dashboard
5. Configure build settings:

| Setting | Value |
|---|---|
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Node Version | `18` |
| Port | `9000` |

6. After first deploy, run seed via Render Shell:
```bash
npm run seed
```

### Important

- `uploads/` is **ephemeral on Render** — files are wiped on every redeploy. Switch to Cloudinary or S3 for production.
- Set `NODE_ENV=production` — enables strict CORS, strips error stack traces from responses.
- Set `FRONTEND_URL` to your frontend's production domain.

---

## Scripts

```bash
npm start          # Production server
npm run dev        # Development server (nodemon)
npm run seed       # Seed admin, mentor + milestones
npm run destroy    # Wipe all collections
```

---

*DSHub Internship Program · Cohort A 2026 · SDG 8 & 9*