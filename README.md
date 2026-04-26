# Design Tokens Management API

NestJS API using PostgreSQL, Drizzle ORM, and Better Auth.

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
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/design_tokens_management
AUTH_SECRET=replace-with-a-long-random-secret
BETTER_AUTH_URL=http://localhost:4000
```

Create the database (example):

```bash
createdb design_tokens_management
```

Run migrations:

```bash
pnpm db:migrate
```

## Run the app

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
- CORS is configured for `http://localhost:4000` with credentials enabled.

## API routes

### Auth routes

- `POST /api/auth/sign-up/email`
- `POST /api/auth/sign-in/email`
- `POST /api/auth/sign-out`
- `GET /api/auth/get-session`

### User routes

- `GET /users/me` (requires authenticated session)
- `GET /users/public` (anonymous allowed)
- `GET /users/optional` (auth optional)

## Testing

```bash
pnpm test
pnpm test:e2e
pnpm test:cov
```
