# Database Migration Guide

Run from `backend/` after taking a current database backup.

```bash
npm run migrate:ad-specific-boosts
npm run migrate:seller-membership-index
npm run backfill:boost-performance
```

Purpose:
- `migrate:ad-specific-boosts` — allows separate active boosts per seller + advert while preserving existing listings.
- `migrate:seller-membership-index` — enforces the account-level seller membership uniqueness model without replacing advert boosts.
- `backfill:boost-performance` — establishes analytics baselines for boosts created before performance tracking was introduced.

Never run destructive migration commands against production without a verified backup and rollback plan.
