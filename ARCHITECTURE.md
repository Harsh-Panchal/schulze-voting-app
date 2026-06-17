# Schulze Voting Platform — Architecture Document

---

## 1. CURRENT STATE (Implemented)

### What's Built
- Frontend-only web app (Next.js)
- Mock data in browser localStorage
- No backend, no database, no authentication

### Current Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        CURRENT STATE                          │
│                     (Frontend Only - MVP)                     │
└──────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │      Browser        │
                    │                     │
                    │  ┌───────────────┐  │
                    │  │  Next.js App  │  │
                    │  │               │  │
                    │  │  • Landing    │  │
                    │  │  • Create     │  │
                    │  │  • Vote       │  │
                    │  │  • Results    │  │
                    │  └───────┬───────┘  │
                    │          │          │
                    │  ┌───────▼───────┐  │
                    │  │ localStorage  │  │
                    │  │ (mock data)   │  │
                    │  └───────────────┘  │
                    └─────────────────────┘

   Data Flow:
   User → UI Forms → Mock API Layer (src/lib/api.ts) → localStorage
                                                      → Read back to UI

   Limitations:
   • Data is per-browser (not shared between users)
   • No real Schulze computation (placeholder equal %)
   • No authentication / voter deduplication
   • Single user testing only
```

### Technology Stack (Current)

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend Framework | Next.js 14 (App Router) | ✅ Done |
| Language | TypeScript | ✅ Done |
| Styling | Tailwind CSS + shadcn/ui | ✅ Done |
| Data Storage | Browser localStorage (mock) | ✅ Done |
| Containerization | Dockerfile (multi-stage) | ✅ Done |
| API Layer | Mock (src/lib/api.ts) | ✅ Done |
| Backend | None | ❌ Not started |
| Database | None | ❌ Not started |
| Auth | None | ❌ Not started |
| K8s Deployment | Manifests not created | ❌ Not started |

---

## 2. TARGET STATE (Full Production Architecture)

### Target Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                           TARGET ARCHITECTURE                                   │
│                    Kubernetes Cluster (Cloud-Agnostic)                          │
└────────────────────────────────────────────────────────────────────────────────┘

    Internet
       │
       ▼
┌──────────────┐
│   CDN        │ ← Static assets (JS/CSS/images) cached globally
│ (CloudFlare/ │
│  CloudFront) │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        KUBERNETES CLUSTER                                      │
│                                                                               │
│  ┌─────────────────────┐                                                     │
│  │   Ingress Controller│ ← TLS termination, routing, rate limiting           │
│  │   (Nginx / Traefik) │                                                     │
│  └──────────┬──────────┘                                                     │
│             │                                                                 │
│     ┌───────┴────────────────────────────┐                                   │
│     │                                    │                                    │
│     ▼                                    ▼                                    │
│  ┌──────────────────────┐    ┌──────────────────────────────┐                │
│  │  FRONTEND SERVICE    │    │    BACKEND SERVICE            │                │
│  │  (schulze-frontend)  │    │    (schulze-backend)          │                │
│  │                      │    │                               │                │
│  │  ┌────────────────┐  │    │  ┌─────────────────────────┐ │                │
│  │  │ Pod 1 (Next.js)│  │    │  │ Pod 1 (Go)              │ │                │
│  │  │ Pod 2 (Next.js)│  │    │  │ Pod 2 (Go)              │ │                │
│  │  │ Pod 3 (Next.js)│  │    │  │ Pod 3 (Go)              │ │                │
│  │  │ ...            │  │    │  │ ...                      │ │                │
│  │  └────────────────┘  │    │  └─────────────────────────┘ │                │
│  │                      │    │                               │                │
│  │  Image: ~50MB        │    │  Image: ~10-15MB             │                │
│  │  Port: 3000          │    │  Port: 8080                  │                │
│  │  Stateless           │    │  Stateless                   │                │
│  │  HPA: 2-10 pods      │    │  HPA: 3-15 pods             │                │
│  └──────────┬───────────┘    └──────────────┬───────────────┘                │
│             │                                │                                │
│             │         REST API (JSON)        │                                │
│             └────────────────────────────────┘                                │
│                                              │                                │
│                                              ▼                                │
│                              ┌───────────────────────────────┐               │
│                              │       DATA LAYER              │               │
│                              │                               │               │
│                              │  ┌─────────────────────────┐ │               │
│                              │  │    PostgreSQL 16         │ │               │
│                              │  │    (Primary + Replicas)  │ │               │
│                              │  │                          │ │               │
│                              │  │  Tables:                 │ │               │
│                              │  │  • elections             │ │               │
│                              │  │  • candidates            │ │               │
│                              │  │  • ballots               │ │               │
│                              │  │  • ratings               │ │               │
│                              │  │  • results               │ │               │
│                              │  │  • users                 │ │               │
│                              │  └─────────────────────────┘ │               │
│                              │                               │               │
│                              │  ┌─────────────────────────┐ │               │
│                              │  │    Redis 7 (Future)      │ │               │
│                              │  │    • Session cache       │ │               │
│                              │  │    • Rate limiting       │ │               │
│                              │  │    • Election data cache │ │               │
│                              │  └─────────────────────────┘ │               │
│                              └───────────────────────────────┘               │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Request Flow (Target)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         REQUEST FLOW                                       │
└──────────────────────────────────────────────────────────────────────────┘

  [Voter opens browser]
       │
       ▼
  [CDN] ← serves cached static assets (JS, CSS, images)
       │
       ▼
  [Ingress] ← TLS, routing: /* → frontend, /api/v1/* → backend
       │
       ├──── GET /create ──────────► [Frontend Pod] → renders HTML
       │
       ├──── POST /api/v1/elections ──► [Backend Pod] → validates → PostgreSQL
       │
       ├──── GET /vote/abc123 ─────► [Frontend Pod] → renders vote form
       │
       ├──── POST /api/v1/elections/abc123/ballots ──► [Backend Pod]
       │                                                    │
       │                                               validates ballot
       │                                               checks duplicates
       │                                               stores in PostgreSQL
       │                                                    │
       │                                               returns 201 Created
       │
       ├──── GET /results/abc123 ──► [Frontend Pod] → calls backend API
       │                                                    │
       │     GET /api/v1/elections/abc123/results ──► [Backend Pod]
       │                                                    │
       │                                        runs Schulze algorithm:
       │                                          1. Build pairwise matrix d
       │                                          2. Compute edge strengths S
       │                                          3. Floyd-Warshall beatpaths P
       │                                          4. Determine winner
       │                                          5. Compute scores
       │                                          6. Normalize to %
       │                                                    │
       │                                        returns ranked results JSON
       │
       └──── displays results in UI
```

### Scaling Strategy

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        SCALING ROADMAP                                     │
└──────────────────────────────────────────────────────────────────────────┘

  Phase A: < 1,000 users
  ┌─────────────────────────────────────────┐
  │  1 Frontend Pod                         │
  │  1 Backend Pod                          │
  │  1 PostgreSQL Pod (no replicas)         │
  │  Ingress with basic rate limiting       │
  └─────────────────────────────────────────┘

  Phase B: 1,000 – 10,000 users
  ┌─────────────────────────────────────────┐
  │  2-5 Frontend Pods (HPA on CPU)         │
  │  3-8 Backend Pods (HPA on CPU)          │
  │  PostgreSQL + PgBouncer (conn pool)     │
  │  CDN for static assets                  │
  └─────────────────────────────────────────┘

  Phase C: 10,000 – 50,000 users
  ┌─────────────────────────────────────────┐
  │  5-10 Frontend Pods                     │
  │  8-15 Backend Pods                      │
  │  PostgreSQL + Read Replicas             │
  │  Redis (caching + rate limiting)        │
  │  CDN + edge caching                     │
  └─────────────────────────────────────────┘

  Phase D: 50,000+ users
  ┌─────────────────────────────────────────┐
  │  10+ Frontend Pods                      │
  │  15+ Backend Pods                       │
  │  PostgreSQL (sharded or managed)        │
  │  Redis Cluster                          │
  │  Message Queue (NATS) for ballot ingest │
  │  Worker Pods for heavy computation      │
  │  Multiple AZs / regions                 │
  └─────────────────────────────────────────┘
```

---

## 3. API CONTRACT (Frontend ↔ Backend)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      REST API ENDPOINTS                                    │
│                  Base URL: /api/v1                                         │
└──────────────────────────────────────────────────────────────────────────┘

  POST   /elections              → Create a new election
  GET    /elections/:id          → Get election details + candidates
  PATCH  /elections/:id/status   → Open or close election
  POST   /elections/:id/ballots  → Submit a voter's ballot
  GET    /elections/:id/results  → Get computed results (after closed)
  GET    /health                 → Service health check

  Request/Response format: JSON
  Auth: Bearer token (JWT) — future
```

---

## 4. DATABASE SCHEMA (Target)

```sql
-- Core tables for PostgreSQL

CREATE TABLE elections (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'draft',  -- draft, active, closed
    alpha       FLOAT NOT NULL DEFAULT 0.5,
    beta        FLOAT NOT NULL DEFAULT 1.0,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    closed_at   TIMESTAMP
);

CREATE TABLE candidates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID NOT NULL REFERENCES elections(id),
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    position    INT NOT NULL DEFAULT 0
);

CREATE TABLE ballots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id         UUID NOT NULL REFERENCES elections(id),
    voter_fingerprint   VARCHAR(255) NOT NULL,  -- anonymous dedup token
    submitted_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(election_id, voter_fingerprint)      -- one vote per voter
);

CREATE TABLE ratings (
    ballot_id       UUID NOT NULL REFERENCES ballots(id),
    candidate_id    UUID NOT NULL REFERENCES candidates(id),
    score           INT NOT NULL CHECK (score >= 0 AND score <= 10),
    PRIMARY KEY (ballot_id, candidate_id)
);

CREATE TABLE results (
    election_id     UUID NOT NULL REFERENCES elections(id),
    candidate_id    UUID NOT NULL REFERENCES candidates(id),
    rank            INT NOT NULL,
    percentage      FLOAT NOT NULL,
    is_winner       BOOLEAN NOT NULL DEFAULT FALSE,
    computed_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (election_id, candidate_id)
);
```

---

## 5. TECHNOLOGY CHOICES SUMMARY

| Component | Current | Target | Why |
|-----------|---------|--------|-----|
| **Frontend** | Next.js 14 + TS | Same | SSR, App Router, standalone Docker output |
| **Backend** | Mock (localStorage) | Go (Gin/stdlib) | Fast O(N³) computation, tiny image, goroutines |
| **Database** | localStorage | PostgreSQL 16 | ACID, relational, proven at scale |
| **Cache** | None | Redis 7 (later) | Session cache, rate limiting, hot data |
| **Container** | Dockerfile ready | K8s Deployment | HPA, rolling updates, health probes |
| **Ingress** | None | Nginx/Traefik | TLS, routing, rate limiting |
| **CI/CD** | None | GitHub Actions (planned) | Build → Push → Deploy pipeline |
| **Auth** | None | JWT tokens (planned) | Stateless, works with K8s |

---

## 6. MIGRATION PATH (Current → Target)

```
  STEP 1 (DONE): Frontend UI with mock data
     │
     ▼
  STEP 2: Build Go backend with real Schulze algorithm
     │    • Implement API endpoints
     │    • Connect to PostgreSQL
     │    • Unit test algorithm
     │
     ▼
  STEP 3: Connect frontend to real backend
     │    • Change src/lib/api.ts to use fetch()
     │    • Add NEXT_PUBLIC_API_URL env variable
     │    • Test end-to-end
     │
     ▼
  STEP 4: Kubernetes deployment
     │    • Create K8s manifests (deployment, service, ingress, HPA)
     │    • Set up CI/CD pipeline
     │    • Deploy to cluster
     │
     ▼
  STEP 5: Production hardening
     │    • Add authentication (JWT)
     │    • Add Redis caching
     │    • Add CDN for static assets
     │    • Monitoring & alerting
     │
     ▼
  STEP 6: Scale & extend
         • Mobile app wrapper
         • Real-time features
         • Advanced visualizations (matrix heatmap, beatpath graph)
```

---

*Last updated: May 2026*
