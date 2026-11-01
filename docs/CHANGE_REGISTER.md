# Production Change Register — 9 September 2026

## Marketplace / seller experience
- Preserved account-level seller subscriptions alongside advert-specific paid boosts.
- Preserved My Marketplace dashboard, Seller Analytics, Saved Items, Offers/Negotiation, Follow Seller, Price Alerts and Boost Performance.
- Standardised monetary entry fields to display thousands separators, e.g. `15,222,222`, while sending/storing clean numeric values.
- Replaced affected mojibake/encoding artefacts in visible marketplace/chat strings.
- Preserved Airtel Money, National Bank POP and MPGS groundwork.

## Finance and payments
- Date From / Date To reconciliation filters.
- Reconciliation filters for method, service type, status, seller/reference/package/advert.
- Expected, claimed/recorded, verified and difference values kept distinct.
- Reconciliation summary totals.
- CSV and Excel-compatible export.
- Controlled manual payment recovery for already-paid/verified transactions whose linked service failed to activate.

## Marketplace Operations Centre
- Responsive executive operations dashboard.
- Plans & Pricing administration.
- Category Add/Edit/Hide/Delete controls.
- Enhanced advert moderation states and bulk actions.
- User Active/Inactive/Under Review/Suspended lifecycle controls.
- Seller 360° operational profile.
- Inbox and marketplace message Trash workflows with 30-day retention support.
- Admin RBAC roles: Super Admin, Admin, Finance, Marketplace, Moderator, Support, Reporting.
- Admin Audit Log UI and backend audit records.
- System Health dashboard.
- Risk & Fraud flags.
- Reported Listings queue retained.
- Support & Disputes centre.
- Admin Notifications centre with customer notification delivery path.
- Admin Access management.

## Branding / presentation
- Restock Tech attribution retained as a partner signature rather than a competing marketplace brand.
- Original Restock Tech logo remains on light backgrounds.
- New `restock-tech-white-lockup.png` asset is used on navy/dark Admin surfaces for reliable contrast.
- Admin login and sidebar retain Zitheke as the primary brand.

## Security / release hygiene
- Admin login rate limiting/security controls retained.
- Backend role enforcement added to operational endpoints.
- Audit metadata redacts sensitive fields.
- Live secrets, private keys, `.env`, node_modules, Git metadata, runtime uploads and dist output excluded from the release archive.
