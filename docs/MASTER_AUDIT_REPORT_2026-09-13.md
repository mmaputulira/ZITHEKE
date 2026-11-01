# Zitheke Marketplace — Master Audit Report

**Audit completion date:** 13 September 2026  
**Baseline:** Zitheke production source release dated 9 September 2026  
**Outcome:** Safe fixes applied directly to the current source. No payment integration, seller-subscription, advert-boost, saved-item, offer, follow, price-alert, analytics, reconciliation or audit functionality was intentionally removed.

## Executive summary

Zitheke is no longer a basic classifieds build. The current codebase already contains a broad buyer/seller marketplace, paid seller plans, advert-specific boosting, Airtel Money, National Bank POP verification, MPGS groundwork, messaging, offers, saved items, follows, price alerts, seller analytics and an operations-focused Admin application.

The audit nevertheless found several issues that reduced trust, consistency, security and marketplace quality. The most important were ownership/system fields being accepted from advert payloads, weak public-listing visibility guards, search and pagination mismatches, a client/server category-management disconnect, Socket.IO conversation authorization gaps, misleading homepage promotion wording, seller-verification presentation based on activity rather than the verified flag, an incorrect 403 sign-out pattern, residual India-oriented location data, inefficient per-ad analytics queries, and fragile MongoDB startup behavior.

Those safe issues have been corrected in this audited release candidate.

## Maturity scores after the audit pass

| Area | Score | Notes |
|---|---:|---|
| Marketplace functionality | 88/100 | Strong breadth; final live regression remains required. |
| Buyer experience | 84/100 | Search/category/listing flows improved; further recommendation/personalization can add value. |
| Seller experience | 88/100 | Strong seller workspace, subscriptions, boosts and analytics. |
| Admin operations | 86/100 | Broad operations centre already present; live role-by-role UAT remains important. |
| Payment readiness | 86/100 | Airtel/NBM/MPGS architecture preserved; live/sandbox payment regression still required. |
| Security | 82/100 | Material ownership/socket/public-visibility hardening applied; refresh-token architecture remains a next-phase improvement. |
| Mobile UX | 82/100 | Existing responsive implementation retained; physical-device regression is still a go-live gate. |
| Performance | 81/100 | Category caching, query limits and seller-analytics aggregation improved; image/CDN strategy can be improved further. |
| Production readiness | 81/100 | Source is suitable for UAT/staging. Production promotion requires successful local builds, dependency review and UAT. |

## Safe fixes completed

### Listing ownership and moderation integrity
- Advert creation now derives ownership from the authenticated session instead of trusting submitted `ownerUid`/`userId` values.
- Protected system fields such as moderation state, featured/boost state, analytics counters, ownership details and timestamps are removed from seller-supplied create/update payloads.
- Suspended/inactive accounts cannot publish listings.
- Public listing queries now return approved marketplace listings rather than exposing pending/rejected/suspended records by predictable IDs.
- Public advert-search regex input is escaped to prevent user-controlled regex behavior.
- Query page/limit values are bounded to prevent excessive public result requests.

### Search, discovery and category flow
- Main advert search now supports effective server-side sorting: newest, oldest, price ascending/descending and popular.
- API pagination now exposes consistent `pages`, `totalPages` and `hasMore` information.
- Category pages send subcategory filters to the server before pagination, preventing false empty pages caused by filtering only the current client page.
- Public marketplace categories now read the active Admin-managed category catalogue with a presentation fallback for legacy visual assets.
- Category requests use a shared cache to reduce repeated page-load calls.
- Featured sections now prefer actual boosted/featured adverts rather than describing ordinary listings as featured/promoted.
- Hard-coded foreign promotional examples were removed from the audited homepage components that were touched.

### Messaging security
- Socket conversation rooms can only be joined when the authenticated user is a participant.
- Typing events use the authenticated socket identity instead of trusting a client-supplied sender ID.
- Seen/read updates use the authenticated user and validate conversation participation.

### Authentication/session behavior
- Ordinary HTTP 403 responses no longer sign a customer out automatically.
- Account-level suspended/inactive responses still invalidate the local session.
- The legacy logout side-effect path is no longer required by the customer logout flow.
- Firebase Admin initialization no longer requires a private service-account JSON file to exist in source. Secure environment/path-based credentials are supported; if Firebase Admin is unconfigured, Firebase sign-in fails gracefully rather than crashing application startup.

### Seller trust and analytics
- Seller verification presentation now uses the actual controlled `verified` status rather than deriving trust from listing count.
- Seller per-ad metrics were consolidated into aggregate database queries to reduce repeated query overhead.
- Offer actions re-check listing availability before continuing negotiation.
- Seller-follow creation validates the target seller.

### Localization and marketplace polish
- Remaining active India-oriented location imports were replaced by Malawi district/location data.
- Create Advert location wording now uses **District** and **City / Town** while preserving backend-compatible field names.
- The large default profile image was replaced by a lightweight WebP fallback.
- Vite API proxies use `127.0.0.1:5000` to avoid common Windows/Node localhost IPv4/IPv6 ambiguity during development.

### Database/runtime resilience
- Duplicate Category/Plan slug-index declarations that produced Mongoose warnings were removed.
- MongoDB startup defaults now allow a 30-second selection/connect window.
- Controlled MongoDB retry handling was added before startup is abandoned.
- Retry count and delay are configurable through environment values.
- Dead legacy `uploadData.js` code referencing a non-existent Product model was removed from the release.

## Architecture preserved

The audit intentionally preserves:
- Airtel Money initiation/verification/reconciliation
- National Bank transfer + POP verification
- MPGS/Hosted Checkout groundwork
- seller subscriptions
- advert-specific boosts
- automatic boost expiry
- My Marketplace
- Saved Items
- Offers / negotiation
- Follow Seller
- Price Alerts
- Seller Analytics
- Boost Performance
- My Payments / receipts
- Admin payment verification
- Admin reconciliation
- Seller 360°
- Admin moderation
- Admin RBAC / Audit Log / System Health / Risk / Support features already present

## High-value next-phase recommendations

These were not silently forced into the release because they require product/architecture decisions or broader regression:

1. **Secure HttpOnly refresh-cookie migration** — move refresh-token persistence away from browser local storage, with CSRF-aware session handling.
2. **Approved-listing edit re-review policy** — decide which seller edits should return an approved advert to moderation without unfairly interrupting an active paid boost.
3. **Transactional notification orchestration** — consistently generate buyer/seller notifications for offer, moderation, payment, boost-expiry and price-drop events through one event service.
4. **Saved searches + search alerts** — high-value retention feature for buyers.
5. **Recently viewed + similar listings** — improve rediscovery and browsing depth.
6. **Seller storefront quality layer** — business profiles, response indicators, structured seller information and verified-business workflows without selling trust badges.
7. **Listing-quality score/guided listing creation** — help sellers improve images, descriptions, price completeness and attributes before submission.
8. **Image/CDN hardening** — progressively replace fragile third-party hot-linked category imagery with controlled/local/CDN assets.
9. **Dependency remediation** — review `npm audit` findings package-by-package; do not use `npm audit fix --force` blindly.

## Final release assessment

**READY FOR UAT / STAGING.**

The source audit and static validation have passed the checks documented in `FINAL_VALIDATION_REPORT_2026-09-13.md`. Promotion to live production should occur only after:

1. `npm ci` and `npm run build` succeed for frontend and admin on the deployment/local test host.
2. backend dependencies install and the MongoDB connection test passes.
3. outstanding dependency vulnerabilities are reviewed.
4. the UAT checklist is completed against a staging/test database and non-production payment credentials.
5. real secrets are provided through the deployment environment and never copied into source control.
