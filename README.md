# Design Tokens Management API

NestJS API for design token/workspace management using PostgreSQL, Drizzle ORM, Better Auth, Resend, and Cloudflare R2.

## Stack

- NestJS 11
- PostgreSQL
- Drizzle ORM + drizzle-kit
- Better Auth (`@thallesp/nestjs-better-auth`)

## Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL

## Setup

```bash
pnpm install
```

Create a local `.env` file:

```bash
API_PORT=4000
CORS_ORIGIN=http://localhost:3000
BETTER_AUTH_URL=http://localhost:4000
BETTER_AUTH_SECRET=replace-with-a-long-random-secret

# Option A: single connection string
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/design_tokens_management

# Option B: split database variables (used when DATABASE_URL is not set)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=design_tokens_management

# Email (required)
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=no-reply@example.com

# Cloudflare R2 (required by media module)
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_R2_ACCESS_TOKEN=...
CLOUDFLARE_R2_SECRET_ACCESS_TOKEN=...
CLOUDFLARE_R2_BUCKET_NAME=...
CLOUDFLARE_R2_PUBLIC_URL=https://cdn.example.com
```

### Option A: run PostgreSQL locally

Create the database (example):

```bash
createdb design_tokens_management
```

Run migrations:

```bash
pnpm db:migrate
```

### Option B: run with Docker Compose

The compose setup starts both PostgreSQL and the API service.

```bash
docker compose up --build
```

The API container sets `DATABASE_URL` to connect to the `db` service automatically.

## Run the API locally

```bash
# development
pnpm start:dev

# production build + run
pnpm build
pnpm start:prod
```

Server URL: `http://localhost:4000`

## Database scripts

```bash
# generate migration files from schema changes
pnpm db:generate

# apply migrations
pnpm db:migrate

# open Drizzle Studio
pnpm db:studio
```

## Auth and session notes

- Better Auth is mounted under `/api/auth`.
- CORS uses `CORS_ORIGIN` with credentials enabled.
- Email/password sign-up requires email verification.
- Verification, password reset, and duplicate sign-up notification emails are sent via Resend.

## Health check

- `GET /api/health`

## API modules overview

- `AuthModule` - Better Auth integration, session lifecycle, and auth emails (verification/reset/duplicate sign-up).
- `UserModule` - user profile endpoints for authenticated, optional-auth, and public access patterns.
- `WorkspaceModule` - workspace domain and membership-aware access control.
- `PrimitiveTokenModule` - CRUD for base design tokens.
- `SemanticTokenModule` - CRUD for semantic tokens mapped to primitives.
- `ComponentTokenModule` - CRUD for component-scoped token definitions.
- `DatabaseModule` - shared Drizzle database access.
- `EmailModule` - Resend-backed transactional email delivery.

## API routes

### Auth routes

- `POST /api/auth/sign-up/email` - create account with email/password
- `POST /api/auth/sign-in/email` - sign in with email/password
- `POST /api/auth/sign-out` - clear current session
- `GET /api/auth/get-session` - fetch current session/user
- `POST /api/auth/forget-password` - request password reset email
- `POST /api/auth/reset-password` - set new password using reset token
- `GET /api/auth/verify-email` - verify email using `token` query param
- `POST /api/auth/send-verification-email` - resend verification email

### User routes

- `GET /api/users/me` (requires authenticated session)
- `GET /api/users/public` (anonymous allowed)
- `GET /api/users/optional` (auth optional)

## Testing

```bash
pnpm test
pnpm test:e2e
pnpm test:cov
```
