# Schulze Voting App

A fair voting platform using the Schulze beatpath method with rating intensity. Voters rate candidates on a 0–10 scale, and the system produces a Condorcet-compliant winner with percentage scores.

---

## Prerequisites

- **Node.js** 22+
- **npm** 10+
- **Docker Desktop** (for local PostgreSQL database)

---

## Quick Start (Local Development)

```powershell
# 1. Start PostgreSQL database (Docker Desktop must be running)
docker compose up -d

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Run database migration (creates tables)
npx prisma migrate dev --name init

# 5. Seed sample data (optional)
npx prisma db seed

# 6. Start the app
npm run dev

# 7. Open in browser → http://localhost:3000
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot-reload (port 3000) |
| `npm run build` | Production build (outputs to `.next/`) |
| `npm run start` | Start production server (run after build) |
| `npm run lint` | Run ESLint to check code quality |
| `npm run db:migrate` | Run Prisma database migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |
| `npm run db:generate` | Regenerate Prisma client after schema changes |

---

## Database Commands (Docker Desktop)

```powershell
# Start PostgreSQL
docker compose up -d

# Check it's running
docker compose ps

# View database logs
docker compose logs db

# Connect to PostgreSQL directly (psql)
docker exec -it schulze-db psql -U postgres -d schulze

# Stop PostgreSQL (data is preserved)
docker compose down

# Stop AND delete all data (fresh start)
docker compose down -v

# Restart database
docker compose restart db
```

---

## Testing the App Locally

### Manual Testing Flow:
1. Start the database and dev server (see Quick Start above)
2. Go to `http://localhost:3000` → Landing page
3. Click **"Create Election"** → Fill in title + candidates → Submit
4. You'll be redirected to the **Vote** page → Rate candidates with sliders → Submit
5. Click **"View Results"** → Close election → See winner + ranked list

### Browse Database Visually:
```powershell
npx prisma studio
# Opens at http://localhost:5555
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/schulze?schema=public` | PostgreSQL connection string |
| `PORT` | `3000` | Port the app listens on |
| `NODE_ENV` | `development` | Set to `production` for deployment |

Environment variables are stored in `.env` (gitignored). For production, set `DATABASE_URL` to your hosted PostgreSQL instance (Azure, AWS, GCP).

---

## Project Structure

```
src/
├── app/                           # Next.js App Router
│   ├── page.tsx                   # Landing page
│   ├── layout.tsx                 # Root layout (Header + Footer)
│   ├── globals.css                # Tailwind styles
│   ├── create/page.tsx            # Create election form
│   ├── vote/[id]/page.tsx         # Voting page (rate candidates 0-10)
│   ├── results/[id]/page.tsx      # Results page (winner + rankings)
│   └── api/elections/             # API routes (Next.js server-side)
│       ├── route.ts               # GET /api/elections, POST /api/elections
│       └── [id]/
│           ├── route.ts           # GET/PATCH /api/elections/:id
│           ├── ballots/route.ts   # POST /api/elections/:id/ballots
│           └── results/route.ts   # GET /api/elections/:id/results
├── components/
│   ├── ui/                        # shadcn/ui components (Button, etc.)
│   └── layout/                    # Header, Footer
├── lib/
│   ├── api.ts                     # Frontend API client (fetch calls)
│   ├── db.ts                      # Prisma client singleton
│   ├── types.ts                   # TypeScript interfaces
│   ├── constants.ts               # App constants
│   └── utils.ts                   # Utility functions
├── generated/prisma/              # Auto-generated Prisma client (gitignored)
prisma/
├── schema.prisma                  # Database schema (Election, Candidate, Ballot)
└── seed.ts                        # Sample data seeder
```

---

## Key Architecture Decisions

1. **Full-stack Next.js** — API routes (`src/app/api/`) handle server-side logic, no separate backend service needed.
2. **PostgreSQL + Prisma ORM** — Type-safe database access with auto-generated client and built-in migrations.
3. **Driver adapter pattern** — Uses `@prisma/adapter-pg` for direct PostgreSQL connection (Prisma 7).
4. **Schulze algorithm** — Computed server-side in the results API route using pairwise beatpath with Floyd-Warshall.
5. **Single API layer** (`src/lib/api.ts`) — All frontend-to-backend calls go through this one file.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm install` fails | Ensure Node.js 22+ is installed |
| Port 3000 in use | Kill existing process or use `PORT=3001 npm run dev` |
| Database connection refused | Ensure Docker Desktop is running and run `docker compose up -d` |
| `prisma migrate` fails | Check `DATABASE_URL` in `.env` and that PostgreSQL container is running |
| Prisma client errors | Run `npx prisma generate` to regenerate the client |

