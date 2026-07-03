# Future Items & Roadmap

Prioritized backlog for the Schulze Voting App. MVP focus: **working demo deployed on Kubernetes with core voting, stored results, and minimal auth**.

---

## 🎯 MVP (Priority Order)

### Phase 1: Core Data & Logic Fixes

#### 1. Separate Result Table + Async Calculation
- Add a `Result` model to Prisma schema (electionId, candidateId, rank, percentage, isWinner, computedAt)
- When "Close" is triggered: compute Schulze results → store in DB → mark election as closed
- Results API reads from DB instead of recomputing
- While calculating: show "Calculating results..." state; once done, highlight "View Results" button
- **Priority**: HIGH — foundational for everything else

#### 2. Reactivate Behavior (Erase Results, Keep Ballots)
- When reactivating a closed election: delete stored results but keep ballots
- New votes can be added in the active phase
- On next close: recalculate with all ballots (old + new)
- **Priority**: HIGH — depends on #1

#### 3. Remove Ranking from Results (Temporarily)
- Hide ranking/ordering in results UI, just show winner + percentage scores
- Revisit once beatpath logic is fully validated
- **Priority**: MEDIUM — quick UI change, reduces confusion

---

### Phase 2: Authentication & Authorization

#### 4. Sign Up / Sign In (Minimal Auth)
- Email + password authentication (bcrypt hashed)
- JWT or session-based tokens
- Simple sign-up and sign-in pages
- Store users in a `User` model (id, email, passwordHash, createdAt)
- **Priority**: HIGH — required for creator ownership

#### 5. Creator-Only Election Management
- Link elections to their creator (add `creatorId` to Election model)
- Only creator can Close / Reactivate / Delete their elections
- Voters see "Election is ongoing" after voting (no close button)
- Guest/anonymous users can vote without signing in
- **Priority**: HIGH — depends on #4

---

### Phase 3: Containerization & Deployment

#### 6. Containerize the Application
- Create `Dockerfile` for the Next.js app (multi-stage build)
- Update `docker-compose.yml` for local dev with both app + DB containers
- Test the container locally
- **Priority**: HIGH — required for K8s deployment

#### 7. Host PostgreSQL on Azure
- Azure Database for PostgreSQL — Flexible Server (Burstable B1ms)
- ~$12-15/month (free tier eligible for 12 months)
- Update connection string with `?sslmode=require`
- Run `prisma migrate deploy`
- **Priority**: HIGH — required for cloud deployment

#### 8. Deploy to Kubernetes (AKS)
- Create AKS cluster on Azure
- Push container images to Azure Container Registry (ACR)
- Apply K8s manifests (deployments, services, ingress)
- Configure environment variables / secrets
- Verify end-to-end flow in production
- **Priority**: HIGH — final MVP milestone

---

## 📋 Post-MVP Backlog (Priority Order)

### 9. Separate Frontend & Backend Containers
- Split into two containers: Next.js frontend (SSR) + API backend
- Separate resource allocation and scaling per container
- Define Kubernetes manifests (Deployment, Service, Ingress) for each

### 10. Setup Telemetry, Monitoring & Logging
- Application Insights or OpenTelemetry for traces
- Structured logging (Winston or Pino)
- Health check endpoints for K8s probes
- Dashboard for request metrics, errors, latency

### 11. Improve UI
- Better mobile responsiveness
- Loading states and error handling UX
- Toast notifications for actions (close, delete, vote submitted)
- Polish design with consistent component library

### 12. Improve Security
- Rate limiting on API routes
- CSRF protection
- Input validation/sanitization
- Helmet headers
- SQL injection protection (Prisma handles this, but audit)

### 13. Public Election Features
- Shareable election links
- Public vs private elections toggle
- Embed election widget

### 14. Data Retention Policy
- If election closed for 30+ days → delete ballot data, keep results
- Move to "archived" non-reactivatable state
- Configurable retention period per election
- Cron job or scheduled Azure Function to enforce

### 15. Resource Tuning & Auto-Scaling
- Set CPU/memory requests and limits on K8s pods
- Horizontal Pod Autoscaler (HPA) based on CPU/request count
- Load testing to determine baseline resource needs
- Cost optimization

---

## ✅ Completed

- Elections list page with Active/Closed tabs
- Close/Reactivate/Delete actions on election cards
- Browse Elections button on landing page
- Header navigation link to Elections
- Vote count display on election cards
