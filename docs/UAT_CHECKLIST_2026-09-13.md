# Zitheke Business UAT Checklist — 13 September 2026

Use a test database and non-production payment credentials where applicable.

## 1. Buyer journey
- [ ] Register / sign in.
- [ ] Browse the homepage and categories on desktop and mobile.
- [ ] Search for a listing and test Newest / Price / Popular sorting.
- [ ] Open a category and a subcategory containing more than one page of results.
- [ ] Open a listing and confirm only approved listings are publicly visible.
- [ ] Save and remove a listing from Saved Items.
- [ ] Follow / unfollow a seller.
- [ ] Enable / disable a Price Alert.
- [ ] Make an offer using comma-formatted MWK entry.
- [ ] Seller counters; buyer accepts or withdraws.
- [ ] Message the seller; confirm typing/read behavior works only in the correct conversation.
- [ ] Report a listing.

## 2. Seller journey
- [ ] Create an advert; confirm ownership is automatically assigned to the signed-in seller.
- [ ] Verify protected fields cannot be manipulated from the browser/API request.
- [ ] Edit an advert.
- [ ] Review My Ads statuses.
- [ ] Confirm My Marketplace metrics load.
- [ ] Review Seller Analytics.
- [ ] Purchase/activate a seller subscription in test mode.
- [ ] Boost one specific approved advert.
- [ ] Verify another advert is not boosted automatically.
- [ ] Check Boost Performance and expiry display.
- [ ] Mark a listing as Sold where applicable.

## 3. Airtel Money
- [ ] Initiate a test payment.
- [ ] Confirm Pending state is understandable.
- [ ] Confirm successful verification activates only the purchased service.
- [ ] Confirm failed payment does not activate the service.
- [ ] Confirm reconciliation scheduler does not duplicate activation.

## 4. National Bank / POP
- [ ] Create payment/reference.
- [ ] Upload JPG, PNG and PDF test POP within allowed limits.
- [ ] Confirm unauthorized user cannot view another user's POP.
- [ ] Admin approves POP; service activates once.
- [ ] Admin rejects POP with reason.
- [ ] Customer uploads replacement POP.
- [ ] Receipt/payment acknowledgement is available in My Payments.

## 5. Admin Operations Centre
- [ ] Admin login works.
- [ ] Dashboard totals load.
- [ ] Reconciliation filters Date From / Date To correctly.
- [ ] CSV export works.
- [ ] Excel-compatible export works.
- [ ] Expected / Claimed / Verified / Difference values are correct.
- [ ] Payment Verification approve/reject works.
- [ ] Plans & Pricing can add/edit/hide a plan without code change.
- [ ] Category add/edit/hide/show updates the public marketplace category catalogue.
- [ ] Advert moderation supports individual and bulk actions.
- [ ] User lifecycle Active / Inactive / Under Review / Suspended works as intended.
- [ ] Seller 360° loads seller/listing/payment/boost information.
- [ ] Risk Flags and Reported Listings load.
- [ ] Support / Disputes flow works.
- [ ] Notifications can be published to the intended audience.
- [ ] Audit Log records important Admin changes.
- [ ] System Health displays operational status.
- [ ] Role permissions prevent Finance/Moderator/Support users from performing unauthorized operations.

## 6. Mobile checks
Test at approximately 320, 360, 375, 390, 430 and 768 px widths:
- [ ] Header/search/navigation.
- [ ] Category navigation.
- [ ] Product cards and product detail.
- [ ] Image gallery.
- [ ] Make Offer / Counter Offer.
- [ ] Messaging.
- [ ] My Marketplace / My Ads.
- [ ] Create/Edit advert.
- [ ] Seller subscription / Advert boost checkout.
- [ ] My Payments / POP upload.
- [ ] Admin navigation/tables/modals on supported admin devices.

## 7. Go-live gate
- [ ] Frontend `npm run build` succeeds.
- [ ] Admin `npm run build` succeeds.
- [ ] Backend `npm run db:test` succeeds.
- [ ] Dependency audit reviewed and accepted/remediated.
- [ ] Live secrets are in environment/secret manager only.
- [ ] Payment credentials changed from test to live only after UAT sign-off.
