# Zitheke Audit Feature Matrix — 13 September 2026

| Feature / Area | Audit status | Action / Result | Priority |
|---|---|---|---|
| Advert ownership on create | Fixed | Authenticated session is authoritative; client ownership/system fields stripped. | Critical |
| Advert protected fields on edit | Fixed | Seller cannot mass-assign moderation/boost/analytics/ownership fields. | Critical |
| Public advert visibility | Fixed | Public list/detail/search paths restricted to marketplace-visible approved records. | Critical |
| Search regex safety | Fixed | User text escaped before regex use. | High |
| Search sort behavior | Fixed | Newest/oldest/price/popular supported server-side. | High |
| Search pagination contract | Fixed | `pages`, `totalPages`, `hasMore` aligned. | High |
| Category/subcategory pagination | Fixed | Subcategory now filters server-side before pagination. | High |
| Admin-managed categories on public site | Improved | Shared active-category service/cache adopted by audited marketplace components. | High |
| Featured/promoted homepage accuracy | Fixed | Genuine featured/boosted records preferred; misleading fallback wording removed. | High |
| Socket conversation authorization | Fixed | Participant check required to join conversation room. | Critical |
| Typing identity spoofing | Fixed | Sender identity comes from authenticated socket. | Critical |
| Message-seen identity spoofing | Fixed | Authenticated user + participant validation used. | Critical |
| 403 customer logout behavior | Fixed | Forbidden actions do not automatically terminate valid sessions. | High |
| Firebase Admin source-secret dependency | Fixed | Secure env/path configuration; graceful unavailable state. | High |
| Seller verified presentation | Fixed | Trust marker is driven by controlled verified status. | High |
| Offer availability checks | Fixed | Negotiation validates current advert availability. | High |
| Follow seller validation | Fixed | Follow target must be a valid seller. | Medium |
| Seller analytics N+1 pattern | Improved | Metrics use aggregate queries. | Medium |
| Malawi location data | Fixed | Active India-oriented location imports removed. | High |
| Default avatar payload | Fixed | Large PNG replaced with lightweight WebP. | Medium |
| MongoDB startup timeout | Improved | 30s selection/connect defaults. | High |
| MongoDB retry handling | Added | Controlled retry loop before startup failure. | High |
| Duplicate Mongoose slug index warnings | Fixed | Duplicate schema index declarations removed. | Medium |
| Dead legacy Product importer | Removed | Broken unused script removed. | Medium |
| Airtel Money | Preserved | No intentional gateway behavior removal. | Critical |
| National Bank + POP | Preserved | Verification architecture retained. | Critical |
| MPGS groundwork | Preserved | Existing architecture retained. | Critical |
| Seller subscription | Preserved | Account-level seller membership retained. | High |
| Advert boost | Preserved | Specific-ad boost linkage retained. | High |
| Saved Items | Present | Existing implementation retained. | Medium |
| Offers / negotiation | Present + hardened | Existing flow retained and availability checks strengthened. | High |
| Follow Seller | Present + hardened | Existing flow retained and target validation strengthened. | Medium |
| Price Alerts | Present | Existing implementation retained. | Medium |
| Seller Analytics | Present + optimized | Aggregate-query improvement applied. | High |
| Boost Performance | Present | Existing implementation retained. | High |
| Reconciliation | Present | Existing Admin operations retained. | Critical |
| Payment verification | Present | Existing POP/admin verification retained. | Critical |
| Seller 360° | Present | Existing Admin implementation retained. | High |
| Admin RBAC | Present | Existing role-based architecture retained; role UAT still required. | Critical |
| Audit Log | Present | Existing audit architecture retained. | High |
| System Health | Present | Existing operations view retained. | High |
| Refresh token storage | Next phase | Move refresh token to Secure/HttpOnly cookie architecture after planned regression. | High |
| Approved-ad edit re-review | Product decision | Define which substantive edits should re-enter moderation. | High |
| Saved searches/search alerts | Recommended | Strong buyer-retention enhancement. | Medium |
| Recently viewed/similar listings | Recommended | Strong discovery enhancement. | Medium |
| Controlled category imagery | Recommended | Replace fragile third-party hotlinks progressively. | Medium |
