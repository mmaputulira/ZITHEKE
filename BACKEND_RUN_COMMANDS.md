# Zitheke Backend - Correct Run Commands

The backend lives in `zitheke_work/backend`. Avoid duplicating `backend/` in paths after you have already changed into that folder.

## Recommended setup

```bash
cd backend
npm ci
```

## Start backend

```bash
npm start
```

Development mode:

```bash
npm run dev
```

## Required advert-specific boost migration

```bash
npm run migrate:ad-specific-boosts
```

## Optional boost performance baseline

```bash
npm run backfill:boost-performance
```

## Direct Node equivalents while already inside backend

```bash
node server.js
node scripts/migrate-ad-specific-boosts.js
node scripts/backfill-boost-performance-baseline.js
```

## If running from the project root instead

```bash
node backend/server.js
node backend/scripts/migrate-ad-specific-boosts.js
node backend/scripts/backfill-boost-performance-baseline.js
```

Do not mix the two styles. For example, from inside `backend`, `node backend/server.js` resolves to `backend/backend/server.js` and causes `MODULE_NOT_FOUND` with an empty `requireStack`.
