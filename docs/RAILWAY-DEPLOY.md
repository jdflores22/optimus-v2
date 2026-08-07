# Optimus V2 API on Railway

Host the **ASP.NET Core API** on [Railway](https://railway.com/new) while keeping:

| Component | Where |
|-----------|--------|
| React frontend | Hostinger (`indigo-buffalo-715579.hostingersite.com`) |
| MySQL | Hostinger (remote user **Any Host**) |
| API | Railway |

```
Browser → Hostinger frontend
       → Railway API (https://your-app.up.railway.app/api/...)
              → Hostinger MySQL
```

---

## Railway Variables (same layout as ECMS)

In **Railway → your service → Variables**, add:

| Variable | Value |
|----------|--------|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ASPNETCORE_URLS` | `http://0.0.0.0:8080` |
| `MYSQL_HOST` | `h5g5-db.hstgr.io` *(from Hostinger phpMyAdmin URL — not `localhost`)* |
| `MYSQL_PORT` | `3306` |
| `MYSQL_DATABASE` | `u910121167_61mLrRkFt_OV2` |
| `MYSQL_USER` | `u910121167_61mLrRkFt_OV2` *(Any Host — not `optimusv2` localhost user)* |
| `MYSQL_PASSWORD` | Your DB password |
| `Jwt__Key` | Random secret, 32+ characters |
| `Jwt__Issuer` | `Optimus.V2` |
| `Jwt__Audience` | `Optimus.V2.Client` |
| `Cors__Origins__0` | `https://indigo-buffalo-715579.hostingersite.com` |
| `Cors__Origins__1` | `https://www.indigo-buffalo-715579.hostingersite.com` *(optional)* |
| `FileStorage__UploadPath` | `uploads` |

Alternative to `MYSQL_*`: set one variable `ConnectionStrings__Default` with a full Pomelo connection string.

See [`.env.railway.example`](../.env.railway.example) for a copy-paste template.

---

## Deploy steps

1. Open **[railway.com/new](https://railway.com/new)** → **Deploy from GitHub** → `jdflores22/optimus-v2`
2. Railway builds from `docker/Dockerfile.api` (`railway.toml`)
3. Paste variables above → **Deploy**
4. **Settings → Networking → Generate domain** (e.g. `optimus-v2-production.up.railway.app`)
5. **Volumes → Add volume** → mount path **`/app/uploads`** (required for PDFs/BL/receipts)

---

## Hostinger MySQL (remote)

Use the MySQL user with **Access host: Any Host**:

- User: `u910121167_61mLrRkFt_OV2`
- Do **not** use `u910121167_61mLrRkFt_optimusv2` (localhost only)

### Remote MySQL whitelist (required for Railway)

Railway runs outside Hostinger. You must allow remote connections:

1. **hPanel → Databases → Remote MySQL**
2. Add host **`%`** (any IP — simplest) **or** Railway **Static Outbound IP**
   - Railway → your service → **Settings → Networking → Static Outbound IP** (enable, then copy the IPv4 address)
3. Save, wait ~2 minutes, then **Redeploy** on Railway

Without this step, `/health` stays **Unhealthy** and the pre-deploy migration will fail.

---

## Automatic database migrations

Every Railway deploy runs migrations **before** the new version goes live (`preDeployCommand` in `railway.toml`):

1. **Pre-deploy** — `dotnet Optimus.Api.dll --migrate-only` (creates/updates tables + seed)
2. **Deploy** — API starts; `/health/live` must respond
3. **Verify** — `/health` should return **Healthy** when MySQL is reachable

If pre-deploy fails, the deployment **stops** (no broken release). Check **Deploy logs → Pre-deploy** for the MySQL error.

New EF migrations in code are applied automatically on the next GitHub push to `main`.

---

## Frontend (Hostinger)

Build with your Railway API URL:

```powershell
cd frontend/optimus-web
"VITE_API_BASE_URL=https://YOUR-RAILWAY-DOMAIN.up.railway.app" | Out-File -Encoding utf8 .env.production
npm ci
npm run build
```

Upload `dist/` contents to Hostinger `public_html`.

### Automated deploy script

```powershell
# Once:
copy deploy-config.ps1.example deploy-config.ps1
# Edit deploy-config.ps1 — set SshPassword and verify RemotePath

# Build + publish to origin/hostinger + git pull on Hostinger:
.\deploy.ps1 -SkipGitPush -UsePassword

# SCP fallback if git pull on Hostinger is not set up:
.\deploy.ps1 -SkipGitPush -UsePassword -UseScp
```

Example production values:

| Setting | Value |
|---------|--------|
| `ApiBaseUrl` | `https://optimus-v2-copy-production.up.railway.app` |
| `AppUrl` | `https://indigo-buffalo-715579.hostingersite.com` |

---

## Verify API

```powershell
curl https://YOUR-RAILWAY-DOMAIN.up.railway.app/health
curl -X POST "https://YOUR-RAILWAY-DOMAIN.up.railway.app/api/auth/login" `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@optimus.local","password":"Admin123!"}'
```

On first deploy, EF migrations run in the **pre-deploy** step. Change the default admin password after go-live.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Healthcheck failure | App uses `/health/live` for Railway; check Deploy logs for MySQL errors |
| **Pre-deploy / migration failed** | Deploy logs → **Pre-deploy**. Usually wrong `MYSQL_*` vars or Hostinger Remote MySQL not whitelisted |
| **No tables / migration skipped** | `/health` returns Unhealthy = Railway cannot reach MySQL. Set `MYSQL_HOST=h5g5-db.hstgr.io`, whitelist `%` or Railway IP in Hostinger Remote MySQL, redeploy. Or run `.\scripts\migrate-hostinger.ps1` from your PC |
| `/health` Unhealthy | MySQL unreachable from Railway — fix Remote MySQL + verify `MYSQL_USER` is the **Any Host** user |
| MySQL connection failed | Check `MYSQL_HOST`, remote user (Any Host), Railway IP whitelist |
| CORS error | Match exact frontend URL in `Cors__Origins__0` |
| Upload 404 after redeploy | Attach volume at `/app/uploads` |
| 502 | Set `ASPNETCORE_URLS=http://0.0.0.0:8080` |

---

## Local dev (unchanged)

```powershell
cd src/Optimus.Api
dotnet run
```

Uses `appsettings.Development.json` and `wwwroot/uploads` by default.
