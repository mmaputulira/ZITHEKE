# Zitheke pre-repository release gate — 31 October 2026

This release gate intentionally excludes NEPG, MPGS, Airtel Money UAT and National Bank POP UAT. Those integrations are not release blockers for this pre-repository review and will be handled during/after live deployment as agreed.

## Required before repository upload

1. **Approved staff only** — provision and assign the seven accounts in `backend/constants/zithekeStaff.json`. No Technical Support account is provisioned in this release.
2. **First-login password change** — temporary passwords are supplied only through `ZITHEKE_STAFF_PASSWORD`; every newly provisioned/reset staff account must change its password before accessing Administration.
3. **Buyer ↔ Merchant chat** — chat initiation and message sending must remain limited to an active Buyer and active Merchant, optionally bound to the Merchant's Approved/Sold listing. Real-time typing, offline delivery, delivery receipts and read receipts must use the aligned Socket.IO events in this release.
4. **Database preservation** — never replace the production database. Back up MongoDB before migrations. Run `npm run migrate:marketplace` first as a dry run; resolve duplicate warnings before `--apply`. Keep the generated snapshot until production verification is complete.
5. **Post-migration indexes/sync** — after the marketplace migration succeeds, run `npm run migrate:ad-specific-boosts`, `npm run migrate:seller-membership-index`, then `npm run sync:seller-profile-boosts`.
6. **Staff database verification** — on the production server run `npm run assign:staff` first (dry run), provision only missing approved staff, then apply the role assignment and rerun the dry run to confirm zero missing roster accounts.
7. **Repository safety** — `.env`, service-account keys, uploads, private POP evidence, backups, node_modules and build output must remain outside Git.

## Approved staff roster

- Moses Chirambo — Super Administrator
- Billiat Chikalusa — Marketplace Operations / Moderation / Customer Support / Content
- Precious Mkandawire — Finance & Reconciliation
- Roselyn Milanzi — Payment Verification
- Emily Sikelo — Payment Verification / Reporting & MIS
- Kondwani Kadzakumanja — Moderation / Customer Support / Reporting
- John Kango — Risk & Fraud Review

No Technical Support account is included in this release gate.
