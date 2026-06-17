# Schulze Voting App — Frontend

A fair voting platform using the Schulze beatpath method with rating intensity. Voters rate candidates on a 0–10 scale, and the system produces a Condorcet-compliant winner with percentage scores.

---

## Prerequisites

- **Node.js** 22+ (recommend using [nvm](https://github.com/nvm-sh/nvm))
- **npm** 10+
- **Docker** (for containerized builds)
- **Docker Compose** (optional, for local multi-service dev)

---

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Run development server (hot-reload enabled)
npm run dev

# 3. Open in browser
#    http://localhost:3000
```

The app runs with **mock data** stored in browser localStorage — no backend needed for development.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot-reload (port 3000) |
| `npm run build` | Production build (outputs to `.next/`) |
| `npm run start` | Start production server (run after build) |
| `npm run lint` | Run ESLint to check code quality |

---

## Testing the App Locally

### Manual Testing Flow:
1. Start dev server: `npm run dev`
2. Go to `http://localhost:3000` → Landing page
3. Click **"Create Election"** → Fill in title + candidates → Submit
4. You'll be redirected to the **Vote** page → Rate candidates with sliders → Submit
5. Click **"View Results"** → Close election → See winner + ranked list

### Health Check Endpoint:
```bash
curl http://localhost:3000/api/health
# Response: {"status":"ok","timestamp":"...","service":"schulze-voting-frontend"}
```

---

## Building & Running with Docker

### Build the Docker Image

```bash
# From the project root (where Dockerfile is)
docker build -t schulze-frontend .
```

This creates a multi-stage build:
- Stage 1: Install dependencies
- Stage 2: Build Next.js (standalone output)
- Stage 3: Minimal production image (~50MB)

### Run the Docker Container

```bash
# Run on port 3000
docker run -p 3000:3000 schulze-frontend

# Run with custom backend API URL
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://backend:8080/api/v1 schulze-frontend

# Run detached (background)
docker run -d -p 3000:3000 --name schulze-frontend schulze-frontend
```

### Verify Container is Running

```bash
# Check health
curl http://localhost:3000/api/health

# Check container status
docker ps
docker logs schulze-frontend
```

### Stop & Remove Container

```bash
docker stop schulze-frontend
docker rm schulze-frontend
```

---

## Docker Compose (Frontend + Placeholder Backend)

```bash
# Start all services
docker-compose up --build

# Stop all services
docker-compose down
```

This starts:
- **Frontend** on `http://localhost:3000`
- **Backend placeholder** (nginx) on `http://localhost:8080`

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api/v1` | Backend API base URL |
| `PORT` | `3000` | Port the frontend listens on |
| `NODE_ENV` | `development` | Set to `production` in Docker |

In Kubernetes, inject these via ConfigMaps or Secrets.

---

## Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Landing page
│   ├── create/page.tsx         # Create election form
│   ├── vote/[id]/page.tsx      # Voting page (rate candidates 0-10)
│   ├── results/[id]/page.tsx   # Results page (winner + rankings)
│   └── api/health/route.ts     # Health endpoint for K8s probes
├── components/
│   ├── ui/                     # shadcn/ui components (Button, etc.)
│   ├── election/               # Election-specific components (future)
│   └── layout/                 # Header, Footer
├── lib/
│   ├── types.ts                # TypeScript interfaces (API contract)
│   ├── api.ts                  # API service layer (mock → swap to real)
│   ├── constants.ts            # App constants
│   └── utils.ts                # Utility functions (cn helper)
├── hooks/                      # Custom React hooks (future)
└── context/                    # React context providers (future)
```

---

## Key Architecture Decisions

1. **`output: "standalone"`** in `next.config.ts` — produces a minimal Node.js server for Docker (no full `node_modules` needed in container)
2. **Mock API layer** (`src/lib/api.ts`) — all backend calls go through this single file. When the real Go backend is ready, only this file changes.
3. **Type-safe API contract** (`src/lib/types.ts`) — shared interface definitions ensure frontend and backend stay in sync.
4. **Health endpoint** (`/api/health`) — used by Kubernetes liveness/readiness probes.

---

## Kubernetes Deployment

See `k8s/README.md` for K8s manifest details. Quick overview:

```bash
# Build & push image to registry
docker build -t your-registry/schulze-frontend:latest .
docker push your-registry/schulze-frontend:latest

# Apply K8s manifests (when created)
kubectl apply -f k8s/
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm install` fails | Ensure Node.js 22+ is installed |
| Port 3000 in use | Kill existing process or use `PORT=3001 npm run dev` |
| Docker build fails | Ensure Docker Desktop is running |
| Health check fails in container | Wait 10s for startup (see HEALTHCHECK in Dockerfile) |
| localStorage not persisting | Normal for Docker — data lives in browser, not container |

