# Zitheke buyer and seller release

The existing seller platform has been extended with a separate buyer portal. Existing accounts remain merchants. The Backend, Frontend and Admin architecture, visual identity and seller advertising integrations have been retained.

## Adopted corrections

| Finding | Correction included |
| --- | --- |
| Seller accounts and customers shared an undifferentiated account | Explicit merchant/buyer account types, separate login/signup pages, fresh server account checks and route guards |
| Buyer purchase screens and order APIs were disconnected | Mounted purchase APIs, buyer purchases page and seller sales management |
| No working cart | Persistent buyer cart with eligibility checks and individual purchase requests; unavailable items remain in the cart |
| Negotiation could ignore eligibility and agreed counter prices | Buyer offers only on negotiable listings; participant checks, counteroffer acceptance, duplicate protection and agreed-price order snapshots |
| Multiple buyers could obtain the same item | Transactional reservations, one accepted order per listing, cancellation release and Sold completion |
| Buyer identities could access seller advertising functionality | Merchant authorization on posting, analytics, memberships and advertising payment initiation |
| Chat authorization differed from ordinary login | Session-backed token authentication, current account checks and buyer/merchant/listing validation for new conversations and messages |
| Google authentication could imply verified merchant status | Independent merchantVerified review flag; authentication no longer grants the merchant badge |
| Seller promotion was not connected to the public directory | Active merchant directory and membership-derived promotion, linked from public browsing |
| Admin account controls did not distinguish customers | Typed account filters, merchant applications/review, purchase overview, current admin roles and finance action restrictions |
| Legacy data needed a safe transition | Explicit dry-run migration, duplicate conflict reporting, field snapshot, repeatable apply and rollback |

## Buyer experience

Open `/buyer`, create an account at `/buyer/signup`, or log in at `/buyer/login`. The buyer account contains cart, purchases, offers, saved listings, following, alerts, notifications, profile and settings. Chats are available from the account navigation.

Buyers can browse merchants and approved products, start product conversations, make offers where negotiation is enabled, add eligible items to their cart and send purchase requests. Merchants accept, decline or complete sales from their seller dashboard. Completion marks the item Sold and expires its active listing boost.

Item purchases are **direct-with-seller transactions**: the buyer sends a request, the merchant accepts, and the parties arrange payment and collection. This release does not collect product payment, provide escrow, calculate delivery/tax, or settle merchant proceeds. Airtel, NBM/MPGS and proof-of-payment flows remain for paid seller advertising and memberships that generate Alinafe revenue. A request or accepted offer is not proof of payment.

The existing classified listing represents one item. Quantity/inventory checkout is not implemented. Jobs, services, real estate and education listings are inquiry-only. Cart requests create separate orders for separate listings and can partly succeed.

## Account policy

Legacy accounts and the existing `/signup` flow remain seller accounts. Buyers cannot use seller posting, dashboard, boost or advertising-payment functions. Merchant sessions cannot use buyer cart, offer creation or product-purchase functions.

A buyer may apply for merchant onboarding. Admin approval converts that account to seller-only access and revokes its sessions; it does not add both capabilities to the same session. Someone needing both identities should use separately registered accounts with distinct email/phone credentials under the existing uniqueness rules. Rejection does not remove buyer access. Merchant verification is reviewed separately from onboarding.

## Deployment

1. Back up the live database, application release, uploads and environment configuration. Use a staging database first. Keep writes closed while applying the migration and switching releases.
2. Extract `backend`, `frontend` and `admin` from the ZIP. Install locked dependencies with `npm ci` in each project. Use a supported Node version meeting the included package requirements; validation used Node 22. Production installs may omit development dependencies after validation.
3. Restore the deployment's existing `.env` files and Firebase service credentials outside source control. The ZIP excludes private `.env` files, `serviceAccountKey.json`, dependency folders and local caches. `.env.example` templates are included. The frontend/admin production bundles are included; rebuild them if changing build-time public configuration.
4. The database must support MongoDB transactions (replica set or Atlas). The isolated checks used a MongoDB 7.0.24 replica set. A standalone MongoDB instance is insufficient for purchase reservations and sale completion.
5. In `backend`, run `npm run migrate:marketplace` against staging, inspect duplicate conflicts, and resolve them explicitly. Then run `npm run migrate:marketplace -- --apply`. This keeps legacy identities as merchants and creates the required indexes. The command writes a field snapshot under `backend/backups` before applying changes. Run dry-run/apply against the backed-up production database only during the release window.
6. Configure the existing web server to serve the freshly built frontend/admin and forward `/api` and `/socket.io` to the Backend, including WebSocket upgrades. Keep SPA fallback routing for `/buyer`, `/buyer/account/*`, and Admin routes. Deploy all three projects together.
7. Verify existing seller login, a new buyer signup, product chat, negotiation, cart/request, seller acceptance/completion, merchant review and seller advertising in staging. Verify Airtel/NBM provider sandbox callbacks and proof-of-payment review using the site's existing configured providers before reopening production traffic.

### Rollback

Keep writes closed. Restore the previous release and use the pre-release database backup if writes or orders have occurred since migration. For an immediate pre-traffic field rollback, run `npm run migrate:marketplace -- --apply --rollback backups/<snapshot-file>.json`; this restores migration-owned fields only, not a complete database or later transactions. Do not use that field snapshot to overwrite newer live account/order changes. Keep the full database backup as the authoritative recovery path.

## Validation performed

- Frontend production build: passed.
- Admin production build: passed.
- Backend isolated integration suite: 11 tests passed, zero failures (10 scenarios plus their parent test).
- Checked authoritative account types, legacy compatibility, permission boundaries, registration/login/refresh/logout, negotiated amounts, duplicate offers/orders, concurrent acceptance, cancellation, sale boost expiry, cart partial failures, session revocation, merchant onboarding, seller directory and admin role gates.
- Migration dry-run, apply, repeat apply and snapshot rollback passed against the isolated database.
- Browser checks verified the buyer landing page and separate buyer/seller login screens.
- Existing provider adapter implementations are retained. No live Airtel, NBM/MPGS transaction, production database migration, real email/SMS, or production deployment was performed. Google provider and live real-time delivery still require staging verification with deployment credentials.

Builds report existing bundle-size and outdated browser-data warnings; neither build failed. The original audit and implementation prompt are included as historical review documents; this release note describes the implemented changes and remaining limits.

## Package contents

`backend/`, `frontend/`, `admin/`, this release note, the original audit, the implementation prompt and a source change manifest. Production bundles are in `frontend/dist` and `admin/dist`. Tests and the migration script are included with the Backend. Original project assets/uploads are retained. Private credentials must be restored from the deployment's secured configuration.
