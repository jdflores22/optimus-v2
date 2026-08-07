# Optimus V2 Phase 0 Notes

Phase 0 foundation is complete under `optimus-v2/`.

## Verified
- API builds and runs on `http://localhost:5080`
- Login + refresh token auth works
- Authenticated `/api/hello` works
- Health endpoint returns Healthy
- Frontend production build succeeds
- Default admin seeded: `admin@optimus.local` / `Admin123!`
- Sample PH geo hierarchy seeded

## Runtime notes
- Docker Desktop was not available during setup, so Phase 0 uses XAMPP MySQL on port `3306`
- Redis is optional for Phase 0; when `ConnectionStrings:Redis` is empty, memory cache is used
- `docker-compose.yml` is ready for MySQL 8 + Redis 7 when Docker is available
