# Zitheke Marketplace — Final Audited Source Release

**Release date:** 13 September 2026  
**Release status:** Ready for UAT / staging. Production promotion remains conditional on successful host builds, dependency review and UAT sign-off.

This package consolidates the current Zitheke marketplace, seller subscriptions, advert-specific boosts, immersive buyer/seller tools, Airtel Money, National Bank POP verification, MPGS groundwork and the Zitheke Marketplace Operations Centre, together with the September 2026 full-marketplace audit fixes.

## Applications
- `frontend/` — public marketplace and buyer/seller dashboards
- `backend/` — Node.js / Express / MongoDB API and payment services
- `admin/` — Zitheke Marketplace Operations Centre

## Audit improvements in this release
- authenticated advert ownership and protected-field hardening
- approved-only public advert visibility
- safer search/query handling and consistent pagination/sorting
- server-side category + subcategory filtering before pagination
- public category navigation linked to active Admin-managed categories
- strengthened Socket.IO conversation/typing/read authorization
- corrected customer 403/session behavior
- verified-seller presentation based on the actual controlled verification flag
- seller analytics query optimization
- Malawi location cleanup
- lightweight default avatar
- MongoDB timeout/retry improvements
- secure Firebase Admin credential loading without requiring private JSON in source
- removal of dead legacy importer code
- explicit Windows-friendly local Vite API proxying through `127.0.0.1:5000`

## Preserved major capabilities
- Airtel Money
- National Bank bank transfer + POP
- MPGS groundwork
- seller memberships
- advert-specific boosts
- Saved Items
- Offers / Negotiation
- Follow Seller
- Price Alerts
- Seller Analytics
- Boost Performance
- My Marketplace / My Payments
- Admin reconciliation / payment verification
- Seller 360° / moderation / RBAC / audit / system health / risk / support features already present

## Start here
1. Read `docs/MASTER_AUDIT_REPORT_2026-09-13.md`.
2. Read `docs/FINAL_VALIDATION_REPORT_2026-09-13.md`.
3. Configure secure environment values from `backend/.env.example`.
4. Run dependency install/build checks on the deployment/test host.
5. Complete `docs/UAT_CHECKLIST_2026-09-13.md` before production.

## Important
Never commit live `.env`, private POP evidence, service-account JSON, card data, access tokens, private keys or other live credentials into this source package.
