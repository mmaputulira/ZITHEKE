# Zitheke Buyer + Profile Boost Upgrade — 16 September 2026

This release builds on the 13 September audited source and includes the 15 September ProductDetails syntax correction.

## Added
- Real public seller-profile promotion tied to verified `seller_membership` payments.
- Profile boost start/end/priority state on User.
- Seller-directory API and `/sellers` customer page with promoted sellers ranked first.
- Homepage Promoted Sellers section.
- Promoted Seller indicator on public seller profile.
- One-time `npm run sync:seller-profile-boosts` command for pre-existing active seller memberships.
- Buyer `Buy Now` purchase-request flow.
- Buyer `My Purchases` workspace.
- Seller `Sales & Purchase Requests` workspace.
- Secure server-side resolution of listing or accepted-offer price.
- Human-readable marketplace order references.
- Admin Buyer Purchases oversight.
- Sale completion marks listing Sold and expires its active advert boost.
- Buyer-focused navigation and My Marketplace actions.
- Seller subscription customer wording updated to `Seller Profile Boost` / `Seller Profile Promotion` where appropriate.

## Preserved
- Airtel Money seller-service payment flow.
- National Bank transfer/POP verification.
- MPGS groundwork.
- Advert-specific boosts.
- Saved Items, Offers, Follow Seller, Price Alerts, Seller Analytics and Boost Performance.
- Admin reconciliation, payment verification, RBAC, audit and marketplace operations.

## Buyer payment boundary
Buyer product purchase requests do not charge the buyer through Zitheke in this release. Product payment/collection remains directly arranged with the seller after acceptance until Alinafe approves a seller-settlement/payout/commission model.
