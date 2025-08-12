# Headless DMS (Fastify + TypeScript)

A Document Management System (DMS) API. “Headless” means it exposes a clean HTTP API that any UI (web, mobile, CLI) can consume.

---

## Current Functionalities: 

- Upload and store documents with metadata and tags
- Search and paginate documents
- Generate secure, time-bound download links
- Register and log in users
- Protect routes with JWT auth
- Enforce roles (admin vs user)

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

4) Upload a document (admin only)
```http
POST /api/documents/upload
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

file: <file>
description: "Quarterly report"
tags: "[\"q1\", \"finance\"]"
```

---

## API quick tour

Base URL: `http://localhost:3000/api`

### Users
- POST `/users/register` – create a user
- POST `/users/login` – get a JWT
- GET `/users/all` – list all users (admin)
- GET `/users/:id` – get a user by id (auth)
- PUT `/users/:id` – update user (admin)
- DELETE `/users/:id` – delete user (admin)

### Documents
- POST `/documents/upload` – upload a file (admin)
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
- `UPLOAD_MAX_FILE_SIZE`: bytes (default `10485760` = 10MB)

You can inspect the effective config via:
```bash
npm run cli config -- --format json
```

---

## Architecture (high level)

- Layered/Onion design with inward-pointing dependencies (Domain is innermost):

```
Infrastructure (Adapters: Drizzle, JWT, FS, Logging, Config) ┐
Presentation (Fastify HTTP, Zod validators)                   ├─→ Application (Use Cases + Ports/DTOs) → Domain (Entities + Value Objects)
                                                             ┘
```

- Presentation: Fastify routes/controllers, Zod request validation
- Application: Use cases (e.g., RegisterUser, UploadDocument), ports (interfaces) and DTOs
- Domain: Entities and Value Objects (VOs) enforce invariants and normalization
- Infrastructure: Adapters implementing ports (Drizzle repositories, JWT auth, File storage), DI wiring, config. Depends inward on Application/Domain — never the other way around.
- DI Container: `tsyringe` composition root binds ports to adapters
- CLI: start/dev/health/config/seed helpers

Why this structure?
- Business logic is testable and framework-agnostic.
- Input validation (Zod) is separate from domain invariants (VOs/Entities).
- Ports/Adapters make swapping infra (DB, auth, storage) straightforward.

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
```

Uploads are saved in `./uploads` by default. Metadata lives in PostgreSQL.

---

## Project structure (short version)

```
src/
├─ domain/              # Entities, Value Objects, Factories
├─ application/         # Use cases, Ports (interfaces), DTOs, app services
├─ infrastructure/      # Drizzle repos, JWT, Filesystem, Logging, Config, CLI
├─ presentation/http/   # Fastify routes, controllers, middlewares, validators
├─ framework/           # Bootstrap (app + fastify)
└─ tests/               # Node test suites (VOs, factories, use cases)
```

---

## Value Objects and Auth (quick notes)

Value Objects (VOs) like `EmailAddress`, `UserName`, `FileName`, `MimeType`, `TagList`, `Description`, and typed IDs encapsulate validation + normalization at creation time. Entities are constructed via factories that compose VOs to guarantee valid state.

Auth uses JWT; passwords are hashed with bcrypt.

---

## Troubleshooting

- “I can’t hit the API” → Ensure the server says it’s listening on `PORT` and you’re calling `/api/...`.
- “Unauthorized” → Missing or wrong `Authorization` header. Re-login, then retry.
- “Upload fails” → Check file size vs `UPLOAD_MAX_FILE_SIZE`; verify `UPLOAD_DIR` permissions exist.
- “Port already in use” → Stop other processes using `3000` or change `PORT`.

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


