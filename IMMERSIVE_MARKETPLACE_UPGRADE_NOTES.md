# Zitheke Immersive Marketplace Upgrade

This release is additive to the existing advert-specific boost + Airtel Money + National Bank POP + MPGS architecture. No payment gateway flow was removed or replaced.

## User-side additions

### 1. My Marketplace dashboard
The authenticated `/dashboard` landing page is now a unified marketplace workspace showing:
- Saved Items
- Offers Sent / Received
- Followed Sellers
- Price Alerts
- Listing Views
- Active Boosts
- Seller engagement snapshot
- Top-performing listings

### 2. Saved Items
The existing Favorites feature is retained at database/API level for compatibility, but the user-facing presentation is now "Saved Items". Product detail pages correctly restore saved state when reopened.

### 3. Offers & Negotiation
New structured offer workflow:
- Buyer submits an offer against one specific advert
- Seller can Accept / Decline / Counter
- Buyer can Accept Counter / Withdraw
- One open offer per buyer + advert is enforced
- Users can review Sent and Received offers under `/dashboard/offers`

### 4. Follow Seller
Seller profile pages now allow authenticated buyers to follow/unfollow sellers. Follow counts are returned from the backend and followed sellers are available at `/dashboard/following`.

### 5. Price Alerts
Buyers can switch a price alert on/off from an advert detail page. The baseline price is captured when the alert is created. `/dashboard/price-alerts` highlights listings whose current price is below the saved baseline.

### 6. Seller Analytics
`GET /api/marketplace/analytics` provides seller-safe analytics from existing marketplace activity:
- Ads
- Views
- Saves
- Conversation/inquiry count
- Offer count
- Followers
- Active boosts
- Per-ad metrics

### 7. Boost Performance
When a new advert boost is activated, Zitheke stores a performance baseline (views + saves at activation). The Boost Performance screen then shows views and saves gained during the active boost period, together with remaining boost days.

Existing boosts created before this release have no historical baseline. To begin measuring them from deployment time, install backend dependencies and run the package command from the `backend` folder:

```bash
cd backend
npm ci
npm run backfill:boost-performance
```

If your terminal is already inside `backend`, do **not** prefix paths with `backend/`. The direct equivalent is `node scripts/backfill-boost-performance-baseline.js`.

This does not alter payment status, boost expiry dates, or subscription duration.

## New backend resources
- `models/Offer.js`
- `models/SellerFollow.js`
- `models/PriceAlert.js`
- `Controllers/marketplaceExperienceController.js`
- `routes/marketplaceExperienceRoutes.js`

Base path: `/api/marketplace`

Key endpoints:
- `GET /summary`
- `GET /analytics`
- `POST /offers`
- `GET /offers`
- `PATCH /offers/:offerId`
- `POST /follows/toggle`
- `GET /follows/:sellerUid/status`
- `GET /follows`
- `POST /price-alerts/toggle`
- `GET /price-alerts`

All marketplace experience endpoints require the existing authenticated JWT middleware.

## Payment architecture preserved
The following remain intact:
- Airtel Money payment initiation/verification/reconciliation
- National Bank bank-transfer + POP flow
- Admin POP approval/rejection
- MPGS Hosted Checkout integration
- Advert-specific payment/subscription linkage
- Payment reference / subscription reference / receipt flow
- Automated advert boost expiry

Only one additive change was made to subscription activation: new boosts capture a view/save baseline for performance reporting.

## Deployment notes
1. Deploy backend and frontend together because the new dashboard expects the new `/api/marketplace` endpoints.
2. MongoDB will create the new Offer, SellerFollow and PriceAlert collections automatically on first use.
3. Existing users and ads require no destructive migration.
4. Optionally run the boost baseline script above for already-active boosts.
5. Restart the Node backend after deployment.

## UAT checklist
- Save/remove a listing and confirm Saved Items reflects the change.
- Buyer submits an offer; seller receives it and counters; buyer accepts counter.
- Follow/unfollow a seller and confirm Following page updates.
- Enable a price alert, lower the advert price using the existing edit flow, then confirm a price-drop badge appears.
- Activate a new paid boost and confirm Boost Performance begins from the activation baseline.
- Confirm Airtel Money and National Bank payment flows behave exactly as before.
- Confirm NBM POP approval still activates only the advert tied to that payment.
