# Implementation prompt: separate Zitheke Merchants and Zitheke Users

Work in the supplied existing Zitheke `backend`, `frontend` and `admin` projects. Implement the business model below using the current Express/Mongoose backend, React/Vite applications, JWT/session authentication, Firebase Google login, Socket.IO messaging and payment service architecture. Read the accompanying role-and-flow audit first and verify findings against the current working tree. Do not replace the architecture or rebuild the project from scratch.

## Business model

**Zitheke Merchants are seller-only accounts.** After separate merchant onboarding, they may post/manage their listings, access a merchant dashboard, manage incoming buyer conversations/leads/offers and sales, and purchase listing ads/boosts and existing seller memberships that generate revenue for Alinafe. A merchant session must not create buyer purchase requests, maintain a buyer cart or send buyer offers on another merchant's products.

**Zitheke Users are buyer/customer accounts.** They may register/login, browse, save products, follow merchants, receive price alerts, communicate with merchants, make offers on enabled listings, add eligible products to cart, submit purchases and view their own purchase history. They have no listing posting, seller dashboard/analytics, seller membership or boost purchase/activation permissions unless separately onboarded as a merchant and using an explicitly authorized merchant context.

Do not automatically grant every registration both roles. Reuse authentication infrastructure, not unrestricted permissions. If the same person can maintain both identities, implement explicit context selection with separate authorization and onboarding; do not create a dual-capability default account.

## Preserve existing working foundations

Preserve the approved Zitheke visual design, category/location data, existing public browse/search, listing moderation, owner checks, uploads, password/OTP and Google flows, session refresh/revocation, favorites, conversations/messages, structured Offer model, Order model, and Admin operations. Preserve plan/payment/subscription references, bank proof uploads and finance review, Airtel/NEPG/Mastercard adapters, payment verification/reconciliation, ad-specific boost activation/expiry and historical receipts. Keep MongoDB `_id` references and external UID references mapped correctly.

Use existing naming internally where practical (`Ad`, `sellerUid`, `buyerUid`, `seller_membership`, `ad_boost`). User-facing terminology must clearly distinguish a merchant listing from paid promotion and a product purchase from an advertising payment.

## 1. Introduce explicit marketplace identity and merchant onboarding

Keep staff Admin roles distinct from marketplace account type. Add an explicit buyer/merchant account classification and merchant onboarding/lifecycle data in the current schema architecture; a small linked merchant profile or explicit fields are preferable to replacing User. Include merchant application/approval status, onboarding dates, reviewing admin and reason/history where appropriate. Model reviewed merchant verification separately from emailVerified and phoneVerified.

Ordinary registration defaults to buyer. Provide a clear merchant registration/onboarding entry point. A buyer requesting merchant onboarding does not acquire seller permissions until approved. Existing Google registration must stop setting reviewed merchant verification implicitly. Generic profile update endpoints must not modify marketplace type, onboarding status, verified merchant status or capabilities.

Provide a dry-run migration report that identifies existing listing owners and seller subscription holders as merchant candidates, and unresolved/mixed identities for review. Preserve UIDs, listing ownership, order/offer/chat history and payment references. Do not infer merchant verification from Google authentication or payment. Do not silently destroy buyer history or enable existing accounts as both types. Make migration repeat-safe, reviewable and reversible.

## 2. Enforce permissions on the server

Load current authoritative account/onboarding/lifecycle state when resolving the authenticated principal. Add reusable buyer, active-approved-merchant, owner/participant and staff guards. A valid token or localStorage role alone is insufficient. Role changes, suspension and session revocation must affect refresh, API access and Socket.IO connections/actions consistently.

Apply merchant guards to listing create/edit/delete/mark-sold/feature actions, listing draft optimization, merchant analytics/private listings, received offer management, seller order management and seller subscription/payment initiation/activation. Apply buyer guards to cart, outgoing offers, purchase requests and buyer purchase history. Maintain ownership/participant checks as well as account-type checks.

Retain intentional staff-only moderation/finance functions under Admin authentication and scoped staff permissions. Do not make public marketplace routes an alternative route to admin privilege. Public browse remains available, but listing/merchant eligibility must be checked consistently.

Ensure HTTP and Socket.IO conversation creation verifies legitimate buyer-to-merchant engagement, active listing context and recipient ownership. Merchants may reply/manage existing legitimate leads. Validate identities and display/listing snapshots on the server. Preserve historical access rules explicitly when accounts are suspended.

## 3. Separate the frontend experiences

Extend authentication state with current account type and merchant status from the server, including password, Google and refresh/profile hydration paths. Add role-aware guards for direct URLs and redirects; hidden links alone are insufficient.

Buyer navigation should expose account/profile/settings, saved items, chats, sent offers, following, alerts, eligible cart and My Purchases. Merchant navigation should expose merchant overview, create/manage listings, incoming leads/chats/offers, Sales Orders, paid ads/boost performance, memberships and advertising payments. Shared account settings and support/report access may remain shared where appropriate.

Refactor existing App routes, Navbar, Sidebar, DashboardLayout, MyMarketplace and Offers rather than replacing the applications. Provide meaningful unauthorized/pending-onboarding states. Merchants may browse public products but must not receive buyer transaction controls. After login, preserve the intended authorized destination.

## 4. Fix and complete purchases within the existing Order architecture

Mount `orderRoutes.js` in server.js under `/api/orders`. Connect the existing MyPurchases and SalesOrders components to guarded routes and navigation. Add an eligible-listing purchase action in ProductDetails. Connect the existing Admin MarketplaceOrders component and `listAdminOrders` handler to a scoped admin route such as `/api/admin/ops/orders`.

Fix createOrder's use of `buyer` before its declaration. Remove buyerName/sellerName from the accepted Offer query because those fields are not part of Offer. Resolve the exact accepted offer by listing, participant identities and accepted state; compute the agreed price/currency server-side and snapshot it on the order. Never trust a submitted checkout price or merchant UID.

Require an active buyer, approved active merchant, available eligible listing and valid amount. Prevent self-purchase and buyer attempts to perform seller transitions. Use explicit validated transitions: Pending Seller → Accepted/Declined; buyer cancellation under documented rules; Accepted → Completed by the authorized merchant. Make creation repeat-safe and acceptance/stock reservation/completion atomic. Ensure concurrent attempts cannot sell a single-item listing twice or leave order, listing and boost state inconsistent.

Finish the currently modeled **direct-with-merchant purchase request** flow first. Clearly say that payment/collection is arranged directly with the merchant and seller completion is not gateway payment verification. Do not label a request as a paid product order. This implementation must not redirect product purchases into the advertising CheckoutPage or create a subscription to represent a product purchase.

If collecting buyer funds online is required, document that as a separate extension: order payment records, server verification, stock reservation, merchant settlement, delivery/fulfillment and refund/cancellation policy. Preserve the existing advertising payments as a distinct revenue domain.

## 5. Add an applicable buyer cart and correct negotiation

Define purchasable versus contact/offer-only listing eligibility using existing category/listing data. Do not provide cart/purchase controls for unsuitable jobs, services, price-on-request listings or unavailable products. Add buyer-only persisted cart operations and frontend state/page; validate ownership, availability, price and quantity again at purchase request submission. Keep items grouped by merchant and prevent mixed-merchant ownership in one order. Reuse the existing single-listing Order for single-item requests; introduce line items only if supported inventory requirements need them. Category text quantity must not be treated as stock without explicit validated inventory fields.

Require negotiable=true for structured offers in UI and API. Preserve seller accept/decline/counter and buyer accept-counter/withdraw behavior. Make transitions atomic, prevent duplicate active offers and stale agreed prices, include currency in listing projections, normalize MK/MWK consistently, and snapshot an unambiguous final agreed amount. Tie purchase requests to the exact accepted offer. These are negotiated offers; do not invent auction bidding rules or a winner engine.

## 6. Preserve and complete merchant monetization

Keep `seller_membership` account benefits separate from `ad_boost` listing benefits. Only an approved active merchant can initiate a new seller membership or boost payment. A paid plan never grants merchant approval or verified merchant status. Check current merchant/listing eligibility again before activation. Preserve verified-payment-only activation, server-derived plan price, duplicate/idempotency safeguards, bank review, receipts and reconciliation.

Complete seller directory/profile promotion by providing the missing public directory endpoint and wiring existing SellerDirectory/PromotedSellers components. Derive active promotion from eligible merchant subscriptions or add schema-supported state with reliable activation/expiry sync. Repair the existing profile sync script's use of fields absent from User; do not depend on writes discarded by strict schemas. Explain actual membership benefits and do not imply that account membership boosts every listing.

Use a common sold/moderated/deleted listing lifecycle so all sale paths remove inappropriate boost visibility and retain history consistently. Keep product purchase totals distinct from Alinafe verified advertising/membership revenue in admin reporting.

## 7. Extend Admin within existing operations

Add buyer/merchant filters, merchant onboarding queue and approve/reject/suspend actions with audit trail and reasons. Separate reviewed merchant verification from authentication flags. Retain Seller 360, listing moderation, finance reconciliation and advertising payment views. Complete order visibility with buyer, merchant, listing, reference, negotiated/listing amount, status and direct-payment arrangement. Scope staff access appropriately.

Align Admin Sidebar permissions with backend requireAdminRoles. Review finance mutation routes that currently use only general admin authentication. Apply current staff permissions consistently after role changes. Use explicit marketplace account type/status for notification audiences, growth counts and seller counts rather than existence of any ad.

## 8. Acceptance and delivery

Demonstrate that a fresh buyer cannot post, open merchant routes, request analytics, initiate seller memberships/boosts or activate ads via direct API calls. Demonstrate that a merchant cannot initiate buyer cart/offers/purchases. Pending/rejected/suspended merchants must not transact or promote listings; changing role data in browser storage cannot bypass restrictions.

Test password and Google registration/login/refresh, reviewed verification separation, revoked sessions and active sockets, ownership and unrelated participant denial, fixed-price offer rejection, accepted-counter pricing/currency, valid purchase creation, duplicate/concurrent purchase handling, merchant accept/decline/complete and buyer cancel, unavailable categories/listings, advertising failed/pending/verified payment behavior, boost expiry and sold listing cleanup, and Admin permission consistency. Use isolated test databases and sandbox gateways. Run frontend/admin builds and relevant backend checks; do not claim live payment verification without evidence.

Deliver a concise implementation summary, changed-file list, schema/migration plan and dry-run counts, route/permission matrix, test/build results and any unresolved business decisions. Preserve existing history and avoid unrequested live database/payment changes. Any deployment should be a separate reviewed step.
