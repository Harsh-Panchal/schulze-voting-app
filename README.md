# Schulze Voting App

Create public elections, rate candidates from 0-10, and view the winner after voting closes.
Built with **Next.js, Prisma, and PostgreSQL**.

**Choose one setup below.** Run all commands from the project root in PowerShell.
Both setups use PostgreSQL in Docker, the same root `.env`, and the same database volume.

## 1. Local App + Docker Database

**Requirements:** Node.js 22+, npm 10+, and Docker Desktop running Linux containers.
Only the app runs locally; PostgreSQL runs in Docker. No local PostgreSQL installation is needed.

### Step 1: Configure `.env`

Use the Docker database's default development connection:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/schulze?schema=public
```

If you change `DB_PORT`, update the port in `DATABASE_URL` to match.
Also set **`JWT_SECRET`** to a stable random signing secret. It is required;
the app does not generate a fallback.

### Step 2: Start only the database

```powershell
docker compose --env-file .env -f Docker\docker-compose.yml up -d db
```

The final `db` starts only **`schulze-db`**, not the app container. PostgreSQL
creates the `schulze` database automatically. Wait for it to finish starting
before the next step; view startup logs in Docker Desktop if needed.

### Step 3: Install dependencies and create tables

```powershell
npm ci
npm run db:generate
npx prisma migrate deploy
```

### Step 4: Start the app

If switching from the full Docker setup, stop its app container first to free port 3000:

```powershell
docker compose --env-file .env -f Docker\docker-compose.yml stop app
```

Then run the app locally:

```powershell
npm run dev
```

Open **http://localhost:3000**. Code changes reload automatically; press **Ctrl+C** to stop.

| Optional action | Command |
|---|---|
| Run an optimized build instead | `npm run build`, then `npm run start` |
| Browse the database | `npm run db:studio` |
| Load sample data (**replaces existing data**) | `npm run db:seed` |
| Check code quality | `npm run lint` |
| Stop the database, keeping data | `docker compose --env-file .env -f Docker\docker-compose.yml stop db` |

## 2. App + Database in Docker

**Requirement:** Docker Desktop running Linux containers.
No local Node.js or PostgreSQL installation is needed.

### Step 1: Check `.env` and ports

Keep `.env` at the project root and ensure **`JWT_SECRET` is set**.
Compose refuses to start if it is missing or empty.

If public npm is blocked, set `NPM_REGISTRY` in the same `.env` to your
full IT-approved registry URL, including its path (`npm config get registry`
shows your host setting).
Docker does not inherit the host's npm configuration automatically.

The default host ports are **3000** for the app and **5432** for PostgreSQL.
Stop local services using those ports, or change `APP_PORT` / `DB_PORT` in `.env`.
Compose automatically uses `db:5432` for the app's database connection.

### Step 2: Build and start

```powershell
docker compose --env-file .env -f Docker\docker-compose.yml up -d --build
```

If your terminal is already inside `Docker\`, use this instead:

```powershell
docker compose --env-file ..\.env up -d --build
```

The explicit `--env-file` loads the shared root `.env`; a bare Compose command
inside `Docker\` does not find that file.

This starts **`schulze-db`** and **`schulze-app`**. The app runs
**`prisma migrate deploy` before starting Next.js**, creating tables on a fresh
database and applying pending migrations on later starts.

The image uses Node.js Alpine and Next.js standalone output, plus Prisma's
migration dependencies. It does not copy the full development dependency folder.

**Do not run the local npm/Prisma setup steps.** No SQL volume mount, separate
migration container, startup-script file, health checks, or automatic seeding is used.

### Step 3: Open the app

Open **http://localhost:3000** once the app logs show **Ready**.
Use your `APP_PORT` if you changed it.

**Database UI (optional, requires local Node.js):** from the project root, run
`npx prisma studio --port 5555` and open **http://localhost:5555**. Keep that
terminal running. Studio uses `DATABASE_URL` in `.env`; its host/port must point
to the published database port (normally `localhost:5432`).

Docker uses **development settings with an optimized production build**.
Code changes require a rebuild. If PostgreSQL is still initializing, the app may
restart and retry; a migration failure prevents Next.js from starting.

### Docker commands

| Action | Command |
|---|---|
| Check containers | `docker compose --env-file .env -f Docker\docker-compose.yml ps` |
| Follow logs | `docker compose --env-file .env -f Docker\docker-compose.yml logs -f app db` |
| Rebuild after code changes | `docker compose --env-file .env -f Docker\docker-compose.yml up -d --build` |
| Stop, keeping data | `docker compose --env-file .env -f Docker\docker-compose.yml down` |
| Start again without rebuilding | `docker compose --env-file .env -f Docker\docker-compose.yml up -d` |
| **Reset: delete all database data** | **`docker compose --env-file .env -f Docker\docker-compose.yml down --volumes`** |

**Switching from the old SQL-mounted setup?** That database may have tables but
no Prisma migration history. For this fresh-start development setup, reset its
volume once using the command above, then start again. **This deletes existing
accounts, elections, and votes.** Normal restarts do not delete data.

## Settings

Use **one `.env` file** for both setups. Real secrets must not be committed;
`.gitignore` does not untrack files already in Git.

| Setting | Purpose |
|---|---|
| `DATABASE_URL` | Used by the local app and Prisma Studio; Compose supplies the container connection automatically |
| `JWT_SECRET` | Required signing secret; use a stable random value of at least 32 bytes. No generated fallback |
| `APP_PORT` | Docker app's host port; default `3000` |
| `DB_PORT` | Docker database's host port; default `5432` |
| `NPM_REGISTRY` | Build-only npm registry; defaults to `https://registry.npmjs.org`. Use your IT-approved registry on restricted networks |
| `AUTH_COOKIE_SECURE` | Defaults to `false` in Docker for local HTTP cookies |

This is a **development setup**, not production deployment configuration.
Do not expose the development database publicly. `.env` is excluded from images.

## Try the Voting Flow

**Sign Up -> Create Election -> Submit a guest vote -> Close from Elections -> View Results**

- Guests can browse and vote; only the creator can close, reactivate, or delete an election.
- Closing stores results; **Calculating...** changes to **View Results** automatically.
- Reactivating keeps votes and clears old results. Results show the winner only.

## Quick Troubleshooting

| Problem | What to do |
|---|---|
| Missing `JWT_SECRET` | Set it in the root `.env` and use the matching `--env-file` command above; there is no fallback |
| Local app cannot connect to the database | Check `schulze-db` is running and `DATABASE_URL` uses `localhost` with the port matching `DB_PORT` |
| Docker app keeps restarting | Read the app/database logs; fix connection or migration errors before restarting |
| Existing tables but no migration history | Use the one-time reset above only if you can discard the data; do not reset valuable databases |
| Port already in use | Stop the conflicting service or change the Docker host ports |
| npm TLS error / `Exit handler never called!` during build | Set `NPM_REGISTRY` to your IT-approved registry and rebuild; do not disable TLS verification or use unapproved mirrors |

Docker-specific files are in **`Docker\`**; Prisma schema and migrations remain in **`prisma\`**.
See [FUTURE-ITEMS.md](FUTURE-ITEMS.md) for the roadmap.
