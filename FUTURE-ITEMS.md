# Future Items & Roadmap

Backlog of features, improvements, and tasks to implement.

---

## 🔜 Up Next

### Host PostgreSQL on Azure
- **Service**: Azure Database for PostgreSQL — Flexible Server (Burstable B1ms tier)
- **Cost**: ~$12-15/month (free for 12 months under Azure free tier)
- **Steps**:
  1. Azure Portal → Create "Azure Database for PostgreSQL Flexible Server"
  2. Choose **Burstable B1ms** (1 vCore, 2GB RAM)
  3. Set server name, admin user & password
  4. Networking → Allow your IP + Azure services
  5. Create a database named `schulze`
  6. Update `.env` with new connection string:
     ```
     DATABASE_URL="postgresql://<username>:<password>@<server-name>.postgres.database.azure.com:5432/schulze?sslmode=require"
     ```
  7. Run `npx prisma migrate deploy` to apply schema
  8. Run `npx prisma db seed` to seed initial data (optional)
- **Notes**: Fine-grained token with Contents (Read & Write) needed for git push after changes

---

## 📋 Backlog

### Remove Ranking from Results (Temporarily)
- The ranking/ordering in results needs more investigation into the Schulze algorithm correctness
- For now, remove ranking display and just show winner + percentage scores
- Revisit once the beatpath logic is fully validated

### Store Results in Database
- Currently results are recalculated every time `/api/elections/:id/results` is called
- Instead, compute results once when an election is closed and store them in the database
- Add a `Result` model to the Prisma schema (electionId, candidateId, rank, percentage, isWinner, computedAt)
- Results API should read from DB instead of recomputing

### Creator-Only Election Management
- On submitting a vote, the voter is redirected to a "View Results" page that shows "Election is still ongoing"
- Remove the ability for voters to close an election — only the creator should be able to close it
- Requires adding a `creatorId` or session/token to track who created the election
- The Close/Reactivate/Delete buttons on the elections list should only show for the creator

---

## ✅ Completed

- Elections list page with Active/Closed tabs
- Close/Reactivate/Delete actions on election cards
- Browse Elections button on landing page
- Header navigation link to Elections
