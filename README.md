# Headless DMS (Fastify + TypeScript)

A Document Management System (DMS) API. "Headless" means it exposes a clean HTTP API that any UI (web, mobile, CLI) can consume.

---

## Current Functionalities: 

- Upload and store documents with metadata and tags
- Search and paginate documents
- Generate secure, time-bound download links
- Register and log in users
- Protect routes with JWT auth
- Enforce roles (admin vs user)
- **NEW**: Robust validation with safe wrapper for all endpoints
- **NEW**: Consistent error handling using AppResult pattern
- **NEW**: Zod validation for upload fields (tags, description) on multipart uploads
- **NEW**: Connection pooling for PostgreSQL and database indexes for better search performance

---

## Quick start (3 steps)

1) Install
```bash
npm install
```

2) Configure (create a `.env` file in the project root)
   Required env vars (validated with Zod at startup):
   - `DATABASE_URL` (PostgreSQL connection string)
   - `JWT_SECRET` (signing secret)
   - Optional: `JWT_EXPIRES_IN` (e.g. `24h`), `PORT` (default `3000`), `HOST` (default `0.0.0.0`), `UPLOAD_DIR` (default `./uploads`)
   - Optional DB pool tuning (defaults provided):
     - `PGPOOL_MAX` (default `10`)
     - `PGPOOL_MIN` (default `0`)
     - `PG_IDLE_TIMEOUT_MS` (default `30000`)
     - `PG_CONN_TIMEOUT_MS` (default `2000`)

3) Run
```bash
# Dev mode (hot reload)
npm run dev

# Or via the CLI wrapper
npm run cli dev -- --port 3000
```
The API will be available at: `http://localhost:3000/api`

---

## Try it in 60 seconds

1) Register
```http
POST /api/users/register
Content-Type: application/json

{
  "name": "Jane",
  "email": "jane@example.com",
  "password": "supersecret",
  "role": "user"
}
```

2) Login (copy the token from the response)
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "jane@example.com",
  "password": "supersecret"
}
```
Use the token in the `Authorization` header:
```
Authorization: Bearer <token>
```

3) List documents
```http
GET /api/documents?page=1&limit=10
Authorization: Bearer <token>
```

4) Upload a document
```http
POST /api/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <file>
filename: "example.txt"          # optional; auto-detected if omitted
mimetype: "text/plain"           # optional; auto-detected if omitted
description: "Quarterly report"  # optional, max 1000 chars
tags: "[\"q1\", \"finance\"]"  # stringified JSON array or comma-separated
```
Note: Files are served from `/uploads/<saved-filename>`. Download links are short-lived and validated by JWT.

---

## API quick tour

Base URL: `http://localhost:3000/api`

### Users
- POST `/users/register` – create a user
- POST `/users/login` – get a JWT
- GET `/users/all` – list all users (admin)
- PUT `/users/:id` – update user (admin)
- DELETE `/users/:id` – delete user (admin)

### Documents
- POST `/documents/upload` – upload a file (auth)
- GET `/documents` – list with pagination (auth)
- GET `/documents/:id` – fetch one (auth)
- GET `/documents/search` – search by tags/description/userId (auth)
- POST `/documents/:id/download-link` – generate a secure link (auth)
- GET `/documents/download/:token` – download via secure link
- DELETE `/documents/:id` – delete (admin)
- PUT `/documents/:id/metadata` – update metadata (description, tags)

Tip: Use Postman collections or curl; every protected route needs `Authorization: Bearer <token>`.

---

## Configuration (simple, env-first)

This app reads config from environment variables and validates them at startup. The important ones:

- `DATABASE_URL`: PostgreSQL connection string (required)
- `JWT_SECRET`: used to sign tokens (required)
- `JWT_EXPIRES_IN`: token lifetime (default `24h`)
- `PORT`/`HOST`: server binding (default `3000`/`0.0.0.0`)
- `UPLOAD_DIR`: where files land on disk (default `./uploads`)
- `MAX_FILE_SIZE`/`MAX_FILES`: upload limits (defaults `10MB` / `10`)
- `PGPOOL_MAX`, `PGPOOL_MIN`, `PG_IDLE_TIMEOUT_MS`, `PG_CONN_TIMEOUT_MS`: DB pool tuning

You can inspect the effective config via:
```bash
npm run cli config -- --format json
```

---

## Testing endpoints quickly

A convenience script logs in as the seeded admin, registers a user, lists and searches documents, uploads a file, updates metadata, and fetches a download link.

```bash
# Ensure server is running and DB seeded (admin@example.com / Admin@123)
npm run dev
npm run seed

# Then run the script
bash ./test-endpoints.sh
```

Requires `jq` to be installed. Set `BASE_URL` to override the default:

```bash
BASE_URL=http://localhost:3000 bash ./test-endpoints.sh
```

---

## Notes on static files

Files are saved to `UPLOAD_DIR` (default `./uploads`) and served via Fastify static at `/uploads/`. The server now serves from the project root upload directory, ensuring generated download links resolve correctly.

---

## Everyday commands

```bash
# Start dev server
npm run dev

# Start prod server (after building)
npm run build && npm start

# Or use the CLI directly
npm run cli start -- --port 3000
npm run cli health -- --url http://localhost:3000
npm run cli migrate -- --up

# Run tests
npm run test:domain
npm run test:application
npm run test:infrastructure
npm run test:presentation
npm run test:integration
npm run test:e2e
```

Uploads are saved in `./uploads` by default. Metadata lives in PostgreSQL.

---

## Project structure (short version)

```
src/
├─ domain/              # Entities, Value Objects, Factories (using AppResult<T>)
├─ application/         # Use cases, Ports (interfaces), DTOs, app services (using AppResult<T>)
├─ infrastructure/      # Drizzle repos, JWT, Filesystem, Logging, Config, CLI (using AppResult<T>)
├─ presentation/http/   # Fastify routes, controllers, middlewares, validators (with safe wrapper)
├─ framework/           # Bootstrap (app + fastify)
└─ tests/               # Test suites (currently using Result<T, Error> for mocks)
```

**Architecture Highlights**:
- **Hexagonal Architecture**: Clean separation between domain, application, and infrastructure layers
- **AppResult Pattern**: Consistent error handling using `@carbonteq/hexapp` throughout the stack
- **Safe Validation**: Robust input validation with graceful fallback for edge cases
- **Railway Programming**: Functional error handling patterns for better flow control

---

## Value Objects and Auth (quick notes)

Value Objects (VOs) like `EmailAddress`, `UserName`, `FileName`, `MimeType`, `TagList`, `Description`, and typed IDs encapsulate validation + normalization at creation time. Entities are constructed via factories that compose VOs to guarantee valid state.

**NEW**: All VOs now return `AppResult<T>` for better error handling and type safety.

Auth uses JWT; passwords are hashed with bcrypt.

---

## Troubleshooting

- "I can't hit the API" → Ensure the server says it's listening on `PORT` and you're calling `/api/...`.
- "Unauthorized" → Missing or wrong `Authorization` header. Re-login, then retry.
- "Upload fails" → Check file size vs `UPLOAD_MAX_FILE_SIZE`; verify `UPLOAD_DIR` permissions exist.
- "Port already in use" → Stop other processes using `3000` or change `PORT`.
- **"Validation crashes" → RESOLVED**: Our safe wrapper now handles all validation edge cases gracefully.

Check health quickly:
```bash
npm run cli health -- --url http://localhost:3000
```

---

## Deployment (quick notes)

- Build: `npm run build`
- Start: `npm start`
- Docker (example):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY uploads ./uploads
EXPOSE 3000
CMD ["node", "dist/infrastructure/cli/index.js", "start"]
```

Use environment variables to configure prod (same as local). Keep the app stateless; the filesystem is used for uploads by default—mount a persistent volume in production
---

## CLI and Seeding

Inspect configuration the CLI sees:
```bash
npm run cli:config
```

Run tests:
```bash
npm run test
```

Seed helpers:
```bash
# Non-destructive: add sample admin/users/documents
npm run seed

# Destructive: wipe users/documents, then reseed
npm run seed:reset

# Clear only (no reseed). Use the "--" to pass args to the CLI.
npm run cli -- seed --clear-only
```

Note: `seed --reset`/`--clear-only` only affect the `users` and `documents` tables.

## FAQ

- “Why headless?” → You can pair this backend with any frontend—web, mobile, or another service.
- “Where are files stored?” → On disk (default `./uploads`) and their metadata in PostgreSQL.
- “Can I change upload rules?” → Yes; adjust limits and allowed types in config and validators.
---


