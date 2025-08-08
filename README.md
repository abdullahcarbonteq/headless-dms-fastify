# Headless DMS (Fastify + TypeScript)

A Document Management System (DMS) API. Being “headless,” means it provides a clean HTTP API you can use from any frontend (React, Vue, mobile apps) or other services.

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
- GET `/documents/search?q=...` – search (auth)
- POST `/documents/:id/download-link` – generate a secure link (auth)
- GET `/documents/download/:token` – download via secure link
- DELETE `/documents/:id` – delete (admin)

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

## How it works (high level)

- Controllers: Handle HTTP input/output.
- Services: Orchestrate business use cases (register, upload, search, etc.).
- Repositories: Talk to the database (via Drizzle ORM).
- Entities/Factories/Validators: Core domain model (User, Document) with rules, invariants, and creation helpers.
- Middleware: Auth, validation, and request context.
- DI Container: Wires everything together (using `tsyringe`).
- CLI: A friendly entry point to start the server, inspect config, run migrations, etc.

Why this structure?
- It keeps business logic testable and independent from frameworks.
- It separates “input validation” (Zod schemas) from “business rules” (validators on entities).
- It makes future changes (like switching DB, adding features) much easier.

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
├─ cli/                 # CLI entry points
├─ config/              # Env schemas, DI container, DB
├─ entities/            # Core domain (User, Document)
├─ framework/           # App + Fastify bootstrap
├─ middlewares/         # Auth and related HTTP middleware
├─ modules/
│  ├─ user/             # User controller/service/repo/routes
│  └─ document/         # Document controller/service/repo/routes
├─ shared/              # Cross-cutting helpers (logging, responses)
└─ types/               # TS type extensions (e.g., Fastify)
```

---

## Auth in one minute

1) Login to receive a JWT
2) Send that token in `Authorization: Bearer <token>`
3) The server verifies the token and injects user info into the request
4) Admin-only routes check the user’s role

Passwords are hashed with bcrypt. Tokens are signed and (optionally) expire.

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
CMD ["node", "dist/cli/index.js", "start"]
```

Use environment variables to configure prod (same as local). Keep the app stateless; the filesystem is used for uploads by default—mount a persistent volume in production
---

## FAQ

- “Why headless?” → You can pair this backend with any frontend—web, mobile, or another service.
- “Where are files stored?” → On disk (default `./uploads`) and their metadata in PostgreSQL.
- “Can I change upload rules?” → Yes; adjust limits and allowed types in config and validators.
---


