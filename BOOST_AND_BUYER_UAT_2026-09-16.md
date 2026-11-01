# Zitheke — Boost & Buyer UAT Checklist

## A. Advert boost — payment to live promotion
1. Create or use a seller account with an Approved advert.
2. From My Ads choose Boost Ad on that exact advert.
3. Select a paid boost plan.
4. Pay using the test/UAT Airtel flow or submit National Bank POP.
5. Confirm the payment record identifies the exact advert and boost reference.
6. For NBM, approve the POP in Admin; for Airtel, wait for authoritative paid verification.
7. Confirm the subscription becomes Active.
8. Confirm the selected advert becomes Featured and stores boost start/end dates.
9. Confirm another advert owned by the seller remains unchanged.
10. Confirm Boost Performance begins measuring from activation.
11. Confirm the boosted advert receives promoted/featured placement in marketplace surfaces that use featured ranking.
12. Confirm expiry removes Featured status while the advert remains Approved/listed.

Expected: PASS only if payment verification causes actual advert-state change. A badge displayed only in the browser is not sufficient.

## B. Seller profile boost — payment to public promotion
1. Open My Marketplace -> Boost My Seller Profile.
2. Select a paid profile boost plan.
3. Complete/verify payment.
4. Confirm My Marketplace shows the active profile boost and expiry date.
5. Open `/sellers` in a separate/private browser session.
6. Confirm the paid seller appears in the Promoted group ahead of ordinary sellers.
7. Open the seller's public profile and confirm the Promoted Seller/plan indicator.
8. Confirm an ordinary advert from that seller is not automatically marked Featured unless separately boosted.
9. Confirm Verified Seller status did not change merely because a profile boost was bought.
10. On expiry, confirm the seller returns to normal seller-directory ranking and the promotion indicator disappears.

Expected: profile promotion affects real public discovery/ranking for the paid duration.

## C. Buyer purchase journey
1. Log in as Buyer A.
2. Browse Listings and open an Approved advert owned by Seller B.
3. Click Buy Now.
4. Confirm Zitheke creates a `ZTH-ORD-...` purchase reference.
5. Open My Purchases and confirm the request is Waiting for Seller.
6. Log in as Seller B and open Sales & Purchase Requests.
7. Accept the request.
8. Return to Buyer A and confirm status shows Seller accepted.
9. Use Message Seller to arrange payment/collection directly for this release.
10. Seller marks Complete Sale only when the transaction is complete.
11. Confirm the advert becomes Sold.
12. If the advert had an active paid ad boost, confirm that boost is ended and the listing is no longer featured.

## D. Negotiated buyer price
1. Buyer makes an offer.
2. Seller accepts that offer.
3. Buyer clicks Buy Now on the same advert.
4. Confirm My Purchases uses the accepted offer amount rather than the original listing price.

## E. Negative/security checks
- Buyer cannot Buy Now on their own advert.
- Pending/Rejected/Sold adverts cannot accept new purchase requests.
- A different user cannot update another buyer/seller's order.
- Seller cannot accept two competing orders for the same item simultaneously.
- Client cannot override the listing/order amount.
- Client cannot change seller identity.
- A payment that is only Pending must not activate an advert/profile boost.
- Rejected POP must not activate a boost.
- Re-approving the same verified payment must not double-activate or extend a boost.

## F. Admin
- Buyer Purchases page lists purchase reference, listing, buyer, seller, amount and status.
- Finance/Payment Verification continues to cover seller profile boosts and advert boosts; it must not present direct buyer-to-seller purchase arrangements as Zitheke-collected revenue.
