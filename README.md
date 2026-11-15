# Jump PropTech

A self-hosted property management workspace: properties, units, tenants, leases,
rent records and maintenance requests, backed by PostgreSQL and protected by
per-account email/password sign-in.

## Stack

| Layer    | Technology                                                        |
| -------- | ----------------------------------------------------------------- |
| Web      | React 19, Vite 7, Tailwind CSS 4, wouter, Radix UI                |
| API      | Express 5 (TypeScript), Zod validation, Pino logging              |
| Database | PostgreSQL via Drizzle ORM (`node-postgres` driver)               |
| Auth     | httpOnly session cookie, SHA-256 session tokens, scrypt passwords |

Everything runs from this repository. There is no hosted backend, no demo mode
and no seed data — a new account starts with an empty workspace.

## Requirements

- Node.js 22+
- pnpm 10

No PostgreSQL installation is required for local development: the `dev` script
runs a project-local PostgreSQL cluster through `embedded-postgres`. Point
`DATABASE_URL` at your own PostgreSQL server if you prefer.

## Getting started

```bash
pnpm install
cp .env.example .env   # Windows: copy .env.example .env
pnpm dev
```

`pnpm dev` does three things:

1. Starts the local PostgreSQL cluster in `.local/pgdata` on port `55432` and
   creates the `jump_proptech` database (first run only).
2. Pushes the Drizzle schema if the database has no tables.
3. Starts the API on <http://localhost:8080> and the web app on
   <http://localhost:5173> (Vite proxies `/api` to the API).

Open <http://localhost:5173> and create an account.

### Using an existing PostgreSQL server

Set `DATABASE_URL` in `.env`, then:

```bash
pnpm db:push
pnpm dev:api   # in one terminal
pnpm dev:web   # in another
```

## Environment

| Variable           | Default                                                        | Purpose                             |
| ------------------ | -------------------------------------------------------------- | ----------------------------------- |
| `DATABASE_URL`     | `postgresql://postgres:postgres@localhost:55432/jump_proptech` | PostgreSQL connection string        |
| `PORT`             | `8080`                                                         | API port                            |
| `WEB_ORIGIN`       | `http://localhost:5173`                                        | Allowed browser origin (comma list) |
| `SESSION_TTL_DAYS` | `30`                                                           | Session lifetime                    |
| `NODE_ENV`         | `development`                                                  | `production` marks cookies `Secure` |
| `WEB_PORT`         | `5173`                                                         | Vite dev server port                |
| `API_URL`          | `http://localhost:8080`                                        | Vite proxy target                   |

## Scripts

| Command        | Description                                           |
| -------------- | ----------------------------------------------------- |
| `pnpm dev`     | Local database + API + web app                        |
| `pnpm dev:db`  | Embedded PostgreSQL only                              |
| `pnpm dev:api` | API only (expects a running database)                 |
| `pnpm dev:web` | Web app only                                          |
| `pnpm db:push` | Apply the Drizzle schema to the configured database   |
| `pnpm build`   | Typecheck libs/apps and build the API and web bundles |
| `pnpm start`   | Run the built API server                              |

## API

All responses are JSON. Mutations return the full workspace snapshot:

```
{ user, properties, units, tenants, tenancies, rent, maintenance }
```

Errors use `{ "error": "message" }` with status `400`, `401`, `404`, `409` or
`500`.

| Method   | Path                     | Auth | Description                     |
| -------- | ------------------------ | ---- | ------------------------------- |
| `GET`    | `/api/healthz`           | no   | Health check + database ping    |
| `POST`   | `/api/auth/register`     | no   | Create account and sign in      |
| `POST`   | `/api/auth/login`        | no   | Sign in                         |
| `POST`   | `/api/auth/logout`       | no   | End session                     |
| `GET`    | `/api/auth/me`           | yes  | Current user + workspace        |
| `GET`    | `/api/workspace`         | yes  | Current workspace               |
| `PATCH`  | `/api/profile`           | yes  | Update name/email/phone/company |
| `DELETE` | `/api/workspace`         | yes  | Delete all portfolio records    |
| `POST`   | `/api/properties`        | yes  | Create property                 |
| `PATCH`  | `/api/properties/:id`    | yes  | Update property                 |
| `DELETE` | `/api/properties/:id`    | yes  | Delete property (cascades)      |
| `POST`   | `/api/units`             | yes  | Create unit                     |
| `PATCH`  | `/api/units/:id`         | yes  | Update unit                     |
| `DELETE` | `/api/units/:id`         | yes  | Delete unit                     |
| `POST`   | `/api/tenants`           | yes  | Create tenant + tenancy         |
| `PATCH`  | `/api/tenants/:id`       | yes  | Update tenant + tenancy         |
| `DELETE` | `/api/tenants/:id`       | yes  | Delete tenant (cascades)        |
| `POST`   | `/api/tenancies/:id/end` | yes  | End a tenancy                   |
| `POST`   | `/api/rent`              | yes  | Create rent record              |
| `PATCH`  | `/api/rent/:id`          | yes  | Update rent record              |
| `DELETE` | `/api/rent/:id`          | yes  | Delete rent record              |
| `POST`   | `/api/maintenance`       | yes  | Create maintenance request      |
| `PATCH`  | `/api/maintenance/:id`   | yes  | Update maintenance request      |
| `DELETE` | `/api/maintenance/:id`   | yes  | Delete maintenance request      |

## Data model

- Every row carries `user_id`; all queries are scoped to the signed-in account.
- Unit occupancy is derived: a unit is `Occupied` while it has a tenancy with
  status `Active` or `Notice given`. The stored `Maintenance` flag only applies
  to otherwise-vacant units.
- Tenant duplicates are rejected on ID/passport number, email and phone within
  an account.
- Money is stored as whole rand (`integer` columns) and formatted as ZAR.

## Project layout

```
artifacts/
  api-server/     Express API
  jump-proptech/  React web app
lib/
  contracts/      Shared Zod request schemas and API types
  db/             Drizzle schema, connection and drizzle-kit config
scripts/          Dev orchestration and preinstall guard
```

Local state (the embedded database and readiness marker) lives in `.local/` and
is git-ignored, as is `.env`.
