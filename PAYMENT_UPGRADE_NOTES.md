# Zitheke National Bank + Airtel Money Payment Upgrade

This patch extends the existing Zitheke payment/subscription architecture without removing Airtel Money or Mastercard/MPGS.

## Added

- National Bank bank-transfer payment option using the supplied account details.
- Local Airtel Money and National Bank logos in the customer checkout.
- Backend-generated Zitheke payment references, subscription references and receipt references.
- Secure National Bank Proof of Payment upload (JPG/PNG/PDF, max 5 MB, file-signature validation).
- Private POP storage outside the public `/uploads` path.
- Customer `My Payments` page with payment status, receipt download/print and replacement POP upload after rejection.
- Zitheke-generated Payment Acknowledgement / Subscription Receipt, clearly distinguished from the bank-issued POP.
- Admin `Payment Verification` queue with POP preview, approve-and-activate, reject-with-reason and idempotent approval protection.
- Payment audit events for POP upload/replacement, approval and rejection.
- Existing payment API responses now strip raw gateway request/response payloads before returning payment records to customers.
- Airtel OAuth token responses are no longer stored in payment raw-response payloads.
- Linux import-case fixes for existing `Components` imports.

## National Bank display configuration

The following non-secret values may be overridden in `backend/.env`:

```env
BANK_DISPLAY_NAME=National Bank
BANK_ACCOUNT_NAME=Alinafe Online Limited
BANK_ACCOUNT_NUMBER=1006477832
BANK_BRANCH=
```

## New API routes

Customer:

- `POST /api/payments` with `gateway=bank` and `paymentMethod=national_bank_transfer`
- `POST /api/payments/:paymentId/pop`
- `GET /api/payments/:paymentId/pop`
- `GET /api/payments/:paymentId/receipt`
- `GET /api/payments/me/history`

Admin:

- `GET /api/admin/payments/pop-verification`
- `GET /api/admin/payments/:paymentId/pop`
- `PATCH /api/admin/payments/:paymentId/pop/approve`
- `PATCH /api/admin/payments/:paymentId/pop/reject`

## Existing records

New subscriptions/payments receive human-readable references automatically. To backfill older records, first take a database backup and then run:

```bash
cd backend
npm run backfill:payment-references
```

## Deployment notes

1. Do not restore `.env`, `serviceAccountKey.json`, `node_modules`, `.git`, `dist`, runtime uploads or private POP files from source control.
2. Copy real secrets into the deployment environment or secret manager.
3. Run `npm ci` separately in `backend`, `frontend` and `admin` on the deployment host.
4. Confirm the National Bank account display values in the production environment.
5. Run the reference backfill only after a database backup.
6. Test National Bank POP approval/rejection with non-production sample evidence before go-live.
7. Keep the existing Mastercard/MPGS settings; this patch does not remove that integration.

## Presentation polish update — 03 Sep 2026

The payment flow and backend behaviour are unchanged. This presentation-only pass improves brand consistency across the payment experience:

- Added a reusable `PaymentBrandMark` component so payment-provider logos occupy a consistent visual stage regardless of source-image aspect ratio.
- Increased Airtel Money and National Bank logo prominence on payment-selection cards without stretching either logo.
- Cropped excess whitespace from the supplied National Bank source image into `national-bank-lockup.png`; the logo artwork itself is unchanged.
- Added the Airtel Money brand mark to the Airtel payment modal for continuity after payment-method selection.
- Increased National Bank branding prominence in the transfer/POP panel and rebalanced the amount-due treatment.
- Preserved all existing Airtel Money, National Bank POP, subscription, receipt, verification, and MPGS logic.


## Advert-specific boost upgrade

Paid boost plans are now attached to one advert rather than granting account-wide featuring rights.

Flow: My Ads -> Boost Ad -> Plan -> Airtel Money/National Bank -> verified payment -> selected advert becomes featured until the plan end date. The original advert remains listed after the boost expires.

New links:
- `Subscription.adId` identifies the advert being boosted.
- `Payment.adId` carries the same advert linkage for reconciliation.
- Ads store `boostSubscriptionId`, `boostPaymentId`, `boostStartDate`, and `boostEndDate`.

Before deploying against an existing MongoDB database, run:

```bash
cd backend
npm ci
npm run migrate:ad-specific-boosts
```

This removes the old one-active-subscription-per-user unique index and replaces it with one-active-boost-per-advert. The scheduler expires boosts automatically; default interval is 5 minutes and can be changed with `SUBSCRIPTION_EXPIRY_INTERVAL_MS`.

## Advert-specific boost rollout notes

The paid Boost/Upgrade plans are now advert-specific rather than account-wide. A seller starts from **My Ads -> Boost Ad**, and the selected advert ID is carried through pricing, checkout, payment, verification and activation.

### Required production migration
Before deploying this version against an existing MongoDB database, run:

```bash
cd backend
npm run migrate:ad-specific-boosts
```

If your terminal is already inside `backend`, do **not** run `node backend/scripts/...`; use `npm run migrate:ad-specific-boosts` or `node scripts/migrate-ad-specific-boosts.js`.

This removes the legacy unique index that allowed only one active subscription per user and creates the new active-boost uniqueness rule per user + advert. This permits a seller to boost multiple different adverts at the same time, while preventing two active boosts on the same advert.

Existing legacy active account-level subscriptions that have no `adId` should be reviewed before rollout. Either allow them to expire as legacy records or close/map them administratively; do not silently attach them to a product.

### Boost activation rules
- Only an **Approved** advert owned by the authenticated seller can enter the boost checkout flow.
- The authoritative `adId` is stored on both Subscription and Payment.
- Payment verification cannot switch the purchase to a different advert.
- A verified payment activates only the linked advert.
- A second verified payment cannot double-activate or double-extend the same active boost.
- Different adverts owned by the same seller may have simultaneous paid boosts.
- When the plan duration expires, only that advert loses `featured` status; the normal listing remains available.
- Account-wide seller memberships remain reserved under `scope/purchaseType = seller_membership` for a future separate product. Advert boosts do not grant account-wide premium membership.

### Automatic expiry
The backend runs advert-boost expiry reconciliation automatically. Default interval:

```env
SUBSCRIPTION_EXPIRY_INTERVAL_MS=300000
```

### UAT example - Simple Start
1. Seller creates and receives approval for `BMW X1 - MWK 25,000,000`.
2. Seller opens **My Ads** and clicks **Boost Ad** on the BMW X1.
3. Pricing opens with that advert ID preserved.
4. Seller chooses **Simple Start - MWK 3,000 / 7 days**.
5. Checkout visibly identifies the BMW X1 and offers Airtel Money or National Bank.
6. The Payment and Subscription records both store the BMW X1 `adId`.
7. For NBM, POP verification in Admin shows the BMW X1 beside the payment reference and Boost ID.
8. On approval (or successful Airtel verification), only the BMW X1 is featured.
9. A second advert owned by the seller remains unchanged unless separately boosted.
10. After seven days, the scheduler removes featured status from the BMW X1, but the listing remains normally visible.

### Security/UAT checks
- Attempt to boost another seller's advert -> must fail.
- Attempt to boost Pending/Rejected/Sold/deleted advert -> must fail.
- Tamper with `adId` after subscription creation -> payment/activation must fail ownership/status validation.
- Approve the same payment twice -> must not extend or activate twice.
- Buy boosts for two different owned adverts -> both may remain active independently.
