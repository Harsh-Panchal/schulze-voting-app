# Git PAT (Personal Access Token) Setup

Instructions for setting up Git authentication with a Fine-grained Personal Access Token when the old one expires.

---

## Step 1: Generate a New Fine-grained PAT

1. Go to → https://github.com/settings/tokens?type=beta
2. Click **"Generate new token"** (Fine-grained)
3. Set a **Token name** (e.g., `schulze-voting-app`)
4. Set an **Expiration** (e.g., 90 days)
5. Under **Repository access**, select **"Only select repositories"** → choose `schulze-voting-app`
6. Under **Permissions → Repository permissions**, set:
   - **Contents** → **Read and Write**
   - **Metadata** → **Read** (auto-selected)
7. Click **Generate token**
8. **Copy the token immediately** (you won't see it again)

---

## Step 2: Set the Token in Your Remote URL

Run this command in your project directory (replace `<YOUR_PAT>` with your actual token):

```powershell
git remote set-url origin https://<YOUR_PAT>@github.com/Harsh-Panchal/schulze-voting-app.git
```

This embeds the token directly in the URL — no credential manager needed.

---

## Step 3: Verify

```powershell
# Check the remote is set correctly
git remote -v

# Test with a push
git push origin main
```

---

## Permissions Reference (Fine-grained Token)

| Permission | Access | Purpose |
|------------|--------|---------|
| Contents | Read & Write | Push/pull code |
| Metadata | Read | Auto-selected, required |
| Pull requests | Read & Write | (Optional) Create/manage PRs via `gh` CLI |
| Workflows | Read & Write | (Optional) Push changes to `.github/workflows/` |

> **Why Fine-grained?** More secure than classic tokens — scoped to specific repos with minimal permissions.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `remote: Invalid credentials` | Token expired — repeat Steps 1-2 |
| `fatal: repository not found` | Check repo name in URL is correct |
| Token visible in `git remote -v` | Expected — keep your machine secure |

---

## Quick Reference (Copy-Paste)

```powershell
# Replace YOUR_TOKEN_HERE with the new PAT
git remote set-url origin https://YOUR_TOKEN_HERE@github.com/Harsh-Panchal/schulze-voting-app.git
```
