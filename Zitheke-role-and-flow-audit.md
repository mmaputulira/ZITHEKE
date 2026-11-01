# Zitheke Merchant and Buyer Audit

Reviewed 4 October 2026. **The requested Merchant/Buyer distinction is not implemented.** The export is a classified marketplace with one general customer account, seller advertising subscriptions, messaging and negotiated offers. Product purchase requests are partially written but disconnected and contain a blocking runtime error. It is not a complete buyer commerce flow.

## Scope and verification

The `/mnt/data/zitheke.rar` attachment was available through the referenced conversation as a Windows temporary file. That exact attachment was extracted, without editing its source projects. Archive integrity testing passed. SHA-256: `4d20d35daa3ce3d396cfa35c1a56b9f60a75010ab2eab53cc1b7a7d9bb9a19c2`.

The extraction contains 677 files across `backend`, `frontend` and `admin`. The review inventoried 395 source/configuration/document files, excluding compiled distributions, uploads, backups, dependency locks and credential contents from the source inventory. The account, authorization, route, controller, model, page, navigation and monetization paths below were traced directly in source. Images, videos and compiled assets were inventoried; they do not establish server permissions. Packaged build output is not proof of the deployed version.

This is a source audit with one isolated controller execution using mocked database calls. It does not establish the state of a live database, production configuration, actual payment settlement, or deployed builds. The backend was not started: its startup connects to MongoDB and starts payment reconciliation, subscription expiry and trash cleanup. No source code, live records or payment settings were changed. Existing payment integrations are described as implemented code, not certified live functionality.

## Current architecture

* Backend: Express 5, MongoDB/Mongoose, JWT access tokens with server-side sessions, password/OTP authentication, Firebase Google authentication, Socket.IO and a payment service/gateway layer.
* Frontend and Admin: separate React 19/Vite applications with React Router, Axios and Tailwind styling.
* Listings use `Ad`, with seller identity stored as `ownerUid`. Offers and orders use `buyerUid` and `sellerUid`. Payments/subscriptions refer to `User` by MongoDB `_id`. Preserve both identifier conventions and their mappings.
* Admins have a separate `Admin` model and login. Staff roles include super admin, admin, finance, marketplace, moderator, support and reporting. These staff permissions do not create marketplace buyer/merchant roles.

Evidence references throughout this document are relative to the archive root and use one-based source line numbers where given.

## Current flow versus required flow

| Area | Implemented behavior | Gap against intended business model |
|---|---|---|
| Account creation | Password registration and Google registration create general `User` records. | No explicit buyer account type, merchant onboarding or active merchant status. |
| Marketplace roles | `User.role` supports only `user` and `admin`. Seller identity is inferred from listing ownership. | Buyer and merchant permissions cannot be distinguished. |
| Browse | Public listing/search/category pages; public seller listing/profile context. | Public eligibility is largely listing-status based; merchant account eligibility needs consistent checks. |
| Post/manage listings | Any active authenticated general user can create listings; updates/deletes require ownership or admin role. | Buyers can post and become sellers without merchant onboarding. |
| Dashboard | All logged-in users receive the same dashboard and navigation. | Buyer screens include posting, boosts, seller plans and analytics. Merchants can use buyer actions on other listings. |
| Engagement | Listing chat, callback requests, contact details/WhatsApp, saved items, following and price alerts. | No enforced buyer-to-merchant relationship or merchant eligibility on every entry point. |
| Offers | Structured buyer offers, seller counters, accept/decline and buyer withdrawal/counter acceptance. | Account roles are unrestricted; fixed-price listings can receive offers; no auction bidding engine. |
| Cart | No cart model, API, state provider or cart page found. | Cart and category eligibility rules are absent. Saved items are not a cart. |
| Product purchase | Single-listing direct-with-seller order model and controllers; purchase/sales pages exist. | API and pages are disconnected; no Buy Now action in product details; new order creation fails. |
| Product payment | Orders explicitly specify `direct_with_seller`. | No product checkout, order payment linkage, settlement, refunds or delivery fulfillment engine. |
| Paid listing boost | Plan → pending ad-specific subscription → payment → server verification → activation → expiry. | Useful existing foundation, but no merchant account gate. |
| Seller membership | Separate account-level `seller_membership` subscriptions and payment scope. | General users can purchase these. Membership must not be confused with merchant permission. |
| Seller profile promotion | Discovery components and a sync script are present. | No directory endpoint/route integration; sync fields are absent from the User schema. |
| Admin | Listing moderation, user lifecycle/verification, Seller 360, plans, bank proof review, reconciliation and revenue views. | No merchant onboarding/role lifecycle. Marketplace order component is disconnected. |

## Findings and concrete remediation

### G01 — Blocking: no merchant/buyer authorization boundary

`backend/models/User.js:44` defines `role` as `["user", "admin"]`, defaulting to `user`. Password signup (`Controllers/passwordAuth.controller.js:105`) accepts name, email, phone and password, and creates the default account. Google registration (`Controllers/userController.js:262`) also creates a general account. There is no Merchant model or merchant onboarding state.

`middlewares/authMiddleware.js` verifies JWT, session existence and account lifecycle status, but retrieves only account `status`; `req.user` remains the decoded token. `roleMiddleware.js` is an exact role comparison aimed at admin access. `adPermissionMiddleware.js` protects ownership, not merchant eligibility.

`routes/adsRoutes.js` lets any authenticated account create an ad, optimize a draft and list its ads. `adController.js:201` assigns ownership from the authenticated UID and strips protected fields such as owner, status, featured and boost IDs; these are valuable safeguards to retain. New ads default to Pending moderation. The missing guard is the account's permission to sell.

**Remedy:** keep the authentication system, introduce explicit marketplace account type and merchant lifecycle/onboarding, and enforce them server-side in merchant routes/services as well as frontend guards. Ordinary buyer profile updates must never grant merchant status. An approved merchant profile must be required before posting or purchasing advertising. Ownership checks remain required in addition to role checks.

### G02 — High: shared dashboard gives every account both sets of tools

`frontend/src/App.jsx` protects `/dashboard/*` only by whether `user` exists. Its children include `createAd`, `my-ads`, `payments`, `boost-performance`, offers and buyer tools. `Components/Sidebar/Sidebar.jsx` and active Navbar code expose selling links without marketplace role checks. `MyMarketplace.jsx` loads both summary and seller analytics and emphasizes seller plans, posting and boosts. `Offers.jsx` shows both Sent and Received tabs to everyone.

`context/AuthContext.jsx` persists a general role and restores password sessions from local storage; it has no authoritative current merchant capability/status refresh. A role-sensitive implementation must not trust local storage for permission.

**Remedy:** separate buyer account navigation from merchant dashboard navigation within the same application, add route guards and role-aware landing destinations, and refresh authoritative account capabilities. Merchant sessions must not offer buyer cart, outgoing offers or purchases. Public browsing can remain shared.

### G03 — Blocking: order implementation is disconnected in all three projects

`backend/routes/orderRoutes.js` defines POST `/`, GET `/me` and PATCH `/:orderId`, but `backend/server.js` neither imports nor mounts this router. Calls to `/api/orders` therefore reach the generic not-found handler in this export.

`frontend/src/Components/Dashboard/MyPurchases.jsx` calls `/orders/me?role=buyer`; `SalesOrders.jsx` calls the seller equivalent. Neither is imported/routed in `frontend/src/App.jsx`. ProductDetails has no `/orders` call or Buy Now action, despite the empty-state instructions in MyPurchases telling buyers to choose Buy Now.

`admin/src/Components/Dashboard/MarketplaceOrders.jsx` calls `/ops/orders`, but Admin App and Sidebar do not mount it. `listAdminOrders` exists in `backend/Controllers/orderController.js`, but neither admin route file registers it. Its intended admin API is absent.

**Remedy:** wire existing modules rather than replacing them. Add buyer-only order creation/history, merchant-only sales management, an eligible-listing purchase action and an appropriately authorized admin order route/page.

### G04 — Blocking: new order creation throws before querying accepted offers

`backend/Controllers/orderController.js:40` reads `buyer?.name` while building an Offer query; `const buyer` is declared later at line 53. Optional chaining does not bypass JavaScript's initialization rule.

An isolated execution of the actual controller, with mocked listing and order lookups, returned HTTP 500 and logged **`Cannot access 'buyer' before initialization`**. This occurs for a valid new request after the existing-order reuse branch, even if the buyer has no accepted offer.

The same Offer query includes `buyerName` and `sellerName`, which are not fields in the Offer schema. Matching a negotiated price should use listing ID, participant UIDs, accepted status and a specific validated offer reference; name snapshots belong on Order.

**Remedy:** correct initialization order and remove name predicates; test plain-price and accepted-offer creation separately. Keep server-calculated amounts and snapshot names without accepting a client-supplied price.

### G05 — High: purchase is a direct agreement request, not online product checkout

`models/Order.js` represents one listing and one buyer/seller pair, with Pending Seller, Accepted, Declined, Cancelled and Completed states. It explicitly supports only `paymentArrangement: direct_with_seller`. Seller acceptance and completion are implemented; completion attempts to expire the boost and mark the listing Sold. Buyer cancellation is implemented. The controllers protect participant ownership, but do not enforce marketplace account types.

The Payment model requires a subscription and has only `ad_boost` and `seller_membership` purchase types. Its checkout/gateway identifiers refer to advertising/subscription transactions, not marketplace Orders. A page named Checkout must not be interpreted as product checkout.

Order acceptance uses a separate conflict read, bulk declines and final save. Concurrent sellers' acceptance requests can race. Completion changes boost/listing state before saving the Order, without a shared transaction. Order creation's duplicate check has no unique open-request enforcement. There is no general quantity/stock reservation system; Ad's category-specific string quantity is not reliable inventory.

**Remedy:** first finish the existing direct-with-merchant flow, label it clearly and make acceptance/completion atomic and repeat-safe. Category rules should exclude jobs, unsuitable services and other non-purchasable listings. Cart should produce merchant-specific requests with availability/price revalidation. If buyer money will be collected online, product payments require a separate order payment design and explicit settlement/refund rules; do not reuse an advertising subscription as a product order.

### G06 — High: offers ignore negotiation eligibility and have correctness gaps

`Ad.negotiable` exists (`models/Ad.js:76`), but `ProductDetails.jsx:867` shows Make Offer for any non-owner, and `marketplaceExperienceController.js:createOffer` does not require `negotiable`. A merchant can offer on another merchant's listing because the only buyer check is not being the owner. Responses authorize the stored buyer or seller UID, without marketplace account eligibility.

The createOffer projection omits currency, then reads `ad.currency`, forcing the MWK fallback. The Ad schema defaults to MK while Order/Offer default to MWK; normalization is needed. The duplicate open-offer check uses a read then create with no unique constraint. `counterAmount` can remain on a COUNTERED offer when the seller later accepts; order pricing currently favors counterAmount, so the accepted amount needs an unambiguous definition. Accepted offers are not themselves inventory reservations or orders.

**Remedy:** require an active buyer, an eligible active merchant/listing and negotiable=true on both frontend and backend. Store an explicit agreed amount and currency, enforce valid transitions atomically, and link any resulting purchase request to the exact accepted offer. No auction deadlines, bid ranking or winner assignment were found; structured offers should remain the feature unless auction bidding is separately specified.

### G07 — High: messaging has participant protection but no business-role enforcement

Conversation/message REST routes are authenticated. Controllers check the sender identity and conversation membership for message reads and relevant mutations. The UI supports listing chat and callback requests; Message and Conversation persist listing context, delivery/read state and attachments.

`conversationController.js:startConversation`, REST message creation and Socket.IO message creation accept participant/ad context without establishing that the recipient is the listing's active merchant and that the initiator is an authorized buyer. Socket room joining does check participation, and send checks sender UID.

However, `server.js:329` authenticates sockets with JWT verification only; it does not perform the REST middleware's session revocation/account-status checks. Its non-production fallback accepts a supplied UID. A revoked or suspended session can therefore differ between HTTP and sockets while its token remains valid, and existing connections are not disconnected by the lifecycle operation shown in admin code.

**Remedy:** use a common authoritative principal/eligibility check across HTTP and sockets. Validate listing ownership/recipient at conversation creation, preserve merchant replies to legitimate buyer leads, enforce revocation/suspension on connections and actions, and derive display/listing context server-side.

### G08 — High: merchant verification is conflated with Google registration

Google User creation sets `verified: true` (`userController.js:271`). `sellerStatsController.js` uses that same field for `isVerifiedSeller`, which ProductDetails displays as a verified seller badge. Admin's verified-seller endpoint updates this general User flag.

**Remedy:** separate email/phone authentication verification, approved merchant onboarding and independently reviewed merchant verification. Migrate existing verification conservatively; Google sign-in alone must not certify a merchant. Paying for a boost must not certify a merchant either.

### G09 — High: ad monetization is reusable, but seller eligibility is missing

Subscriptions distinguish `ad_boost` and `seller_membership`. `subscription.service.js` checks active plans, excludes FREE payment, checks approved owned ads, reuses pending subscriptions and guards conflicting active subscriptions. `paymentOrchestrator.service.js` requires an owned pending subscription and derives amount from the plan. Payment references, receipts, bank proof review, Airtel/NEPG/Mastercard gateway adapters, verification and reconciliation code exist.

Server verification activates the subscription; the verified-payment path uses MongoDB transactions. Ad boosts set the listing's featured flag, subscription/payment IDs and start/end dates. Expiry sync clears boost state and emits audit events; server startup schedules it. Account membership is separate from a per-listing boost. Preserve these distinctions and safeguards.

Neither pending-subscription creation nor payment initiation requires an approved merchant account. A general buyer can buy a seller membership without owning an ad. `premiumAccess.service.js` returns a FREE fallback for every general account; plan membership is currently an entitlement tier, not proof of merchant onboarding.

The direct `adController.js:923` Mark Sold route changes only listing status; it does not immediately expire its active boost, whereas the order completion path tries to. Feature enablement checks active boost/date but does not additionally require listing status Approved in that controller. Shared sale/moderation/boost eligibility rules are needed.

**Remedy:** gate advertising initiation and activation on current merchant eligibility while preserving historical receipts. Keep product sale amounts out of Alinafe advertising revenue. Align all sold/suspended/deleted listing paths with boost visibility and retention policies. Confirm gateway behavior using sandbox configuration after implementation; this audit did not make payment requests.

### G10 — High: seller profile promotion is incomplete

SellerDirectory and PromotedSellers request GET `/api/public/sellers` and expect `profileBoost`, but `routes/publicSellerRoutes.js` implements only `/:sellerId/ads`. App has no `/sellers` route, and Home does not integrate PromotedSellers.

`scripts/sync-seller-profile-boosts.js` sets `sellerProfileBoost*` fields on User, but those fields are absent from the current schema. With ordinary strict Mongoose updates, these writes are not a reliable persistence mechanism. Membership activation does not populate this directory contract. This script is not proof that paid profile promotion works.

**Remedy:** implement discovery from approved active merchants and verified active memberships, preferably deriving promotion from subscription records. Wire existing components and define membership benefits separately from individual ad boosts. Do not claim that a seller membership automatically boosts every ad.

### G11 — Medium: admin classification and role enforcement are inconsistent

Admin has substantial reusable operations: lifecycle controls revoke sessions for inactive/suspended users, listing moderation, Seller 360, payment proof verification, reconciliation, subscriptions, plans, audit logs and targeted notifications. There is no merchant application queue, onboarding approval or buyer/merchant account filter. Seller counts are inferred from listing ownership.

`notificationController.js:9` classifies an account as a seller if any Ad exists, including unapproved/historical ads; a merchant with no ads is classified as a buyer. `verified` is not a permission gate.

Admin Sidebar treats staff role `admin` as having all menu access, whereas backend `requireAdminRoles.js` gives unconditional bypass only to `super_admin`. Several routes omit `admin` from their allowed roles. Some subscription/reconciliation mutations have only generic admin authentication, without a finance-specific gate. `adminAuthMiddleware.js` trusts token role claims without reloading current staff permissions; the admin role-update response explicitly says re-login is required.

**Remedy:** use one consistent staff permission matrix in UI and API, apply current permissions to sensitive operations, add audited merchant onboarding/lifecycle controls, and classify notification/report audiences using explicit marketplace account records.

### G12 — Medium: public listing eligibility does not consistently follow account suspension

Public seller stats reject Suspended/Inactive accounts, while public seller ads and general listing queries filter chiefly on Ad Approved status. Admin user suspension does not itself update listing status in the inspected lifecycle controller. Order/offer creation checks approved listings but does not check the seller's account status.

**Remedy:** define a shared eligible-public-merchant/listing predicate across browse, detail, discovery, engagement, offers, orders and advertising. Decide how existing conversations and historical orders remain accessible when an account is suspended. Do not erase historical transaction records.

## Implementation order

1. Add explicit account/onboarding state, verification separation and HTTP/socket permission checks. Produce a conservative migration preview for existing accounts.
2. Fix and connect the existing purchase request modules across Backend, Frontend and Admin; enforce buyer and merchant eligibility and atomic order transitions.
3. Split buyer account and merchant dashboard/navigation; connect role-specific offers, chats, sales and purchase history.
4. Add cart only for eligible products and merchant-specific purchase requests; keep contact/offer-only categories appropriate.
5. Complete seller membership/profile promotion and align listing boost lifecycle; preserve existing payment services and Alinafe revenue accounting.
6. Add focused integration checks for permission bypasses, role/session changes, negotiated prices, concurrency, order transitions, advertising verification/expiry and admin permissions; run both application builds.

## Business decisions to carry into implementation

The user's requirement supersedes the earlier suggestion that every account should automatically buy and sell. A merchant session is seller-only; a buyer session receives no seller permissions. Shared authentication infrastructure is fine, but any person using both identities must be separately onboarded as a merchant and use an explicit authorized context rather than gaining a mixed dashboard automatically.

The existing architecture makes direct-with-merchant purchase requests the least disruptive first implementation. Whether product funds should later be collected online is a separate product decision. Cart applicability, multi-quantity stock and true auction bidding require explicit category/product rules; the implementation must not silently invent those policies.
