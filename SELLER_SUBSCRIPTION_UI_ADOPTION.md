# Zitheke Seller Subscription + Advert Boost UI Adoption

This build restores the original seller subscription plans as an account-level option while retaining advert-specific boosts and all immersive My Marketplace features.

## User-facing structure

Inside **My Marketplace**, sellers now see two separate growth paths:

1. **Upgrade My Seller Account**
   - Account-level seller subscription.
   - Shows the current plan and expiry date.
   - Opens `/pricing?mode=account`.
   - Payment can use Airtel Money or National Bank + POP.
   - Verification activates `scope: seller_membership`.

2. **Boost an Advert**
   - Applies only to a selected advert.
   - Shows current active boosted adverts and days remaining.
   - Starts from My Ads and retains the advert-specific boost flow.
   - Verification activates `scope: ad_boost` and features only the linked advert.

## Preserved immersive features

- Seller Analytics
- Saved Items
- Offers / Negotiation
- Follow Seller
- Price Alerts
- Boost Performance
- Unified My Marketplace dashboard
- Airtel Money
- National Bank POP verification
- Existing MPGS architecture

## Payment separation

Seller subscription:
`Seller -> Seller Plan -> Payment -> Verification -> Seller Membership Active`

Advert boost:
`Seller -> Advert -> Boost Plan -> Payment -> Verification -> Specific Advert Boosted`

The two products share the payment infrastructure but remain separate by `Subscription.scope` / `Payment.purchaseType`.

## Deployment

From the backend folder:

```bash
npm ci
npm run migrate:seller-membership-index
npm start
```

The index command prevents more than one active `seller_membership` subscription per user while still allowing multiple advert boosts on different adverts.

No existing boost, payment, POP, analytics, saved-item, offer, follow, or price-alert data is deleted.
