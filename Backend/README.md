# SkillsBridge API

Production-structured REST API for the SkillsBridge Student Skills Portfolio Platform. Integrates with the Vue 3 + Pinia + Axios frontend.

## Stack

- **Node.js** + **Express**
- **SQLite** only (via **sqlite3** npm package, no ORM)
- **JWT** (jsonwebtoken), **bcrypt**, **Zod**
- **Helmet**, **CORS**, **express-rate-limit** (auth routes)
- **nodemon** for dev

## Setup

```bash
cd Backend
npm install
cp .env.example .env
# Edit .env: set JWT_SECRET (required in production)
# Set ADMIN_EMAIL and ADMIN_PASSWORD to create the admin user (never commit real values)
npm run db:seed   # creates universities, admin (from env), and test student
```

The SQLite database is created automatically on first run at `data/dev.db`. Schema is in `src/db/schema.sql`.

## Run

```bash
npm run dev   # nodemon
# or
npm start
```

API base URL: `http://localhost:3000` (frontend should set `VITE_API_BASE_URL=http://localhost:3000/api`).

## API response format

- **Success:** `{ success: true, data: <payload> }`
- **Error:** `{ success: false, message: "<readable message>" }`

## Auth

- **POST /api/auth/register** – body: `fullName`, `email`, `password`, `universityId`
- **POST /api/auth/login** – body: `email`, `password`
- **GET /api/auth/me** – `Authorization: Bearer <token>`

Rate limit on login/register. JWT includes `userId` and `role`. Suspended users cannot log in.

## Main routes

| Area        | Method | Path | Auth / role |
|------------|--------|------|-------------|
| Students   | GET    | /api/students/me | Bearer, student/admin |
|            | PUT    | /api/students/me | Bearer, student/admin |
|            | PUT    | /api/students/me/skills | Bearer, student/admin |
|            | GET    | /api/students/:id | Public (isPublic only) |
| Projects   | POST/PUT/DELETE | /api/projects, /api/projects/:id | Bearer, owner |
|            | GET    | /api/projects/user/:userId | Bearer, owner |
| Explore    | GET    | /api/explore, /api/explore/students | Public, pagination + filters |
|            | GET    | /api/explore/profiles/:id | Public |
| Universities | GET   | /api/universities | Public (approved only) |
|            | POST   | /api/universities/request | Bearer, student |
| Admin      | GET/PATCH/POST | /api/admin/university-requests, /universities, /users/:id/suspend | Bearer, admin |

## Database

SQLite only. Database file: `data/dev.db` (override with `SQLITE_PATH` or `SQLITE_DIR` in `.env`). Schema: `src/db/schema.sql`. All IDs are UUIDs. Indexes on `User.email`, `User.universityId`, `User.isPublic`, `User.isSuspended`.
