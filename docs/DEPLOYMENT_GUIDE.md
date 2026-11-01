# Production Deployment Guide

## 1. Prerequisites
- Node.js 22 LTS-compatible runtime
- MongoDB Atlas or secured MongoDB deployment
- HTTPS reverse proxy (for example Nginx)
- Process manager such as PM2/systemd

## 2. Backend
```bash
cd backend
cp .env.example .env
# Fill .env with newly issued production credentials only.
npm ci
npm run db:test
npm run migrate:ad-specific-boosts
npm run migrate:seller-membership-index
# Optional for boosts that existed before boost-performance baselines:
npm run backfill:boost-performance
npm start
```

## 3. Frontend
```bash
cd frontend
cp .env.example .env
npm ci
npx update-browserslist-db@latest
npm run build
```
Serve `dist/` behind HTTPS and route `/api` plus Socket.IO to the backend.

## 4. Admin
```bash
cd admin
npm ci
npx update-browserslist-db@latest
npm run build
```
Serve the Admin build behind HTTPS. Use organisational/network restrictions where appropriate in addition to application authentication.

## 5. Local development
Backend:
```bash
cd backend
npm ci
npm run dev
```
Frontend:
```bash
cd frontend
npm ci
npm run dev
```
Admin:
```bash
cd admin
npm ci
npm run dev
```
If Vite reports `/api/... ECONNREFUSED`, confirm the backend is listening on port 5000 (or the configured proxy target).

## 6. Payment controls
- Airtel Money: production credentials only in the production environment.
- National Bank: confirm displayed account details and finance verification users before launch.
- MPGS: keep UAT and production credentials/hosts separate; complete bank/gateway production approval before switching live.

## 7. Branding
- Light surfaces: `/branding/restock-tech-lockup.png`
- Dark/navy Admin surfaces: `/branding/restock-tech-white-lockup.png`
- Zitheke remains the primary platform brand.

## 8. Post-deployment gate
Do not promote to public production until:
- frontend production build succeeds
- Admin production build succeeds
- backend starts and DB test succeeds
- migrations complete
- `docs/UAT_CHECKLIST.md` is signed off
- `docs/SECURITY_RELEASE_CHECKLIST.md` is signed off
