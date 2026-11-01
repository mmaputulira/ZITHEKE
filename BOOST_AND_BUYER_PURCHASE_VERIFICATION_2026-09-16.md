# Zitheke — Boost & Buyer Purchase Verification

Release verification date: 16 September 2026

## Executive confirmation

### Advert boost
The advert boost is operational business logic, not a visual or hard-coded badge. A paid/verified `ad_boost` subscription is linked to one exact advert through `Subscription.adId` and `Payment.adId`. Payment verification calls the subscription activation service. Activation sets the linked advert to `featured: true` and records the boost subscription, payment, start date and end date. Automatic expiry removes featured status without deleting the advert.

National Bank POP approval uses the same activation service after the payment is marked paid and verified. Airtel Money activation occurs only after authoritative payment verification reports a successful transaction state.

### Seller profile boost
The earlier account-level seller subscription became active after payment but did not itself give the public seller profile measurable promoted placement. This release closes that gap.

A verified `seller_membership` payment now activates a real seller-profile promotion for the exact plan period. The user record stores the active profile-boost subscription, plan, priority, start and end dates. Public seller discovery ranks active profile boosts first, and the homepage can surface promoted sellers. Expiry removes the promoted profile state automatically. Paid profile promotion remains separate from Verified Seller status.

Existing active seller memberships created before this release should be synchronized once after deployment:

```bash
cd backend
npm run sync:seller-profile-boosts
```

### Buyer purchasing
The previous Zitheke flow was primarily a classifieds/C2C discovery flow: buyers could browse, save, message, negotiate and follow sellers, while Zitheke checkout was used to purchase seller plans and advert boosts. There was no marketplace Order model or product-purchase lifecycle.

This release adds a Buyer Centre and purchase-request workflow:

`Listing -> Buy Now -> Purchase Request -> Seller Accepts/Declines -> Buyer/Seller arrange payment and collection -> Seller completes sale -> Listing becomes Sold`

If that buyer already has an accepted negotiated offer on the advert, the server uses the accepted offer amount rather than trusting a client-supplied amount.

Buyer features added:
- `Buy Now` on eligible approved adverts.
- `My Purchases` dashboard.
- Human-readable `ZTH-ORD-...` purchase references.
- Seller acceptance/decline.
- Buyer cancellation while open.
- Messaging after acceptance.
- Seller `Sales & Purchase Requests` workspace.
- Completion marks the advert Sold.
- Any active paid advert boost for a sold listing is expired rather than left active on a sold item.
- Admin `Buyer Purchases` oversight page.

## Important payment boundary for buyer purchases

Buyer funds are **not collected by Zitheke for listed products in this release**. Payment/collection is arranged directly between buyer and seller after acceptance.

This is deliberate. The existing Airtel Money, National Bank and MPGS payment foundation is configured for Zitheke/Alinafe merchant payments for seller profile promotion and advert boosts. Reusing that merchant settlement flow for buyer-to-seller product purchases without a seller-payout model would create reconciliation, refund and settlement risk.

Before enabling online buyer product payments, Alinafe/Zitheke should approve:
1. Marketplace commission/fee model.
2. Seller onboarding/KYC requirements for receiving settlements.
3. Settlement destination and payout timing.
4. Refund/cancellation/dispute rules.
5. Whether funds are held/escrowed before delivery/collection.
6. Payment-provider support for marketplace/split settlements or controlled payouts.
7. Finance reconciliation and tax/accounting treatment.

Once those rules are signed off, the new `Order` model is the correct foundation to attach marketplace checkout and settlement to.

## Key implementation points

### Advert boost activation
- Only an approved advert owned by the authenticated seller can be linked to an advert boost.
- A verified payment activates only the linked advert.
- Two active boosts cannot be applied to the same advert.
- The same seller may boost different adverts independently.
- Boost start/end dates are stored.
- Boost expiry is automatic.
- The advert remains normally listed after boost expiry.

### Seller profile promotion
- Profile promotion is activated only after verified payment.
- Promotion has start/end dates matching the paid plan duration.
- Promoted sellers rank ahead of ordinary sellers in `/api/public/sellers`.
- Higher paid plan priority receives higher placement among active promoted sellers.
- Public Seller Profile shows a Promoted Seller/plan indicator.
- Homepage `Promoted Sellers` section displays active promoted profiles when available.
- Verified Seller remains an independent admin-controlled trust status and is not bought through a profile boost.

### Buyer order integrity
- Buyer identity comes from authenticated session, not request payload.
- Seller identity and listing price come from the authoritative advert record.
- A buyer cannot purchase their own advert.
- Only approved adverts accept purchase requests.
- An accepted offer price is resolved server-side.
- Seller cannot accept multiple competing purchases for the same item at the same time.
- Only order participants can update the order.
- Completing a sale marks the advert Sold and ends the active advert boost for that listing.

## Deployment requirement

After deploying the updated source and taking a database backup, run the existing migrations as appropriate, then run:

```bash
cd backend
npm ci
npm run db:test
npm run migrate:ad-specific-boosts
npm run migrate:seller-membership-index
npm run sync:seller-profile-boosts
```

If the first two migrations were already applied on the target database, do not repeat destructive index work blindly; verify their state first. `sync:seller-profile-boosts` is safe to run as a synchronization step for currently active seller memberships.
