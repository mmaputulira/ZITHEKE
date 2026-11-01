# Zitheke Audit Change Register — 13 September 2026

This register records the material source changes made during the full-marketplace audit against the 9 September release baseline.

## Backend
- `backend/Controllers/adController.js` — authenticated advert ownership, protected-field stripping, approved-only public listing behavior, safe search/filter/sort/pagination and bounded public limits.
- `backend/Controllers/categoryController.js` — safer category search/filter logic and public active-category output used by the marketplace.
- `backend/Controllers/marketplaceExperienceController.js` — offer/follow validation hardening.
- `backend/Controllers/searchController.js` — approved-only/safe-regex search behavior.
- `backend/Controllers/sellerStatsController.js` — aggregate seller analytics query optimization.
- `backend/Controllers/userController.js` — protected Firebase sign-in behavior when Firebase Admin credentials are unavailable.
- `backend/config/db.js` — MongoDB timeout and retry resilience.
- `backend/config/firebaseAdmin.js` — secure environment/path-based Firebase Admin credentials; no required private JSON file in source.
- `backend/models/Category.js` — duplicate slug-index declaration cleanup.
- `backend/models/Plan.js` — duplicate slug-index declaration cleanup.
- `backend/routes/adsRoutes.js` — audited listing route behavior preserved/updated with hardened controller flow.
- `backend/routes/userRoutes.js` — logout/user route hardening retained.
- `backend/server.js` — Socket.IO conversation/typing/read authorization strengthening.
- `backend/.env.example` — 30-second MongoDB defaults, retry settings and secure Firebase Admin configuration examples.
- `backend/utils/uploadData.js` — removed because it was unused legacy code referencing a non-existent Product model.

## Marketplace frontend
- `frontend/src/api/axios.js` — normal 403 authorization denials no longer force logout; suspended/inactive account blocks still terminate local access.
- `frontend/src/context/AuthContext.jsx` — simplified/logout-safe session cleanup.
- `frontend/src/services/category.service.js` — shared cached public-category retrieval.
- `frontend/src/hooks/useMarketplaceCategories.js` — Admin-managed active categories decorated with existing marketplace presentation assets.
- `frontend/src/Components/CategoryBar/CategoryBar.jsx` — live active-category adoption.
- `frontend/src/Components/BrowseListings/BrowseListings.jsx` — category/discovery flow improvements.
- `frontend/src/Components/CategoryPage/CategoryPage.jsx` — server-side category + subcategory filtering before pagination.
- `frontend/src/Components/CategorySlider/BaseCategorySlider.jsx` — live category presentation integration.
- `frontend/src/Components/FeaturedListings/FeaturedListings.jsx` — actual featured/boosted listing preference.
- `frontend/src/Components/SpotlightSection/SpotlightSection.jsx` — removal of misleading hard-coded promotion behavior in the audited section.
- `frontend/src/Components/KitchenwarePromo/KitchenwarePromo.jsx` — accurate promoted/popular behavior.
- `frontend/src/Components/Listings/Listings.jsx` — API response/pagination handling corrections.
- `frontend/src/Components/SearchResults/SearchResults.jsx` — search/sort/pagination alignment.
- `frontend/src/Components/ProductDetails/ProductDetails.jsx` — seller trust/verification presentation corrections.
- `frontend/src/Components/Navbar/Navbar.jsx`, `Sidebar.jsx`, `BoostAdSection.jsx`, `MastercardCheckoutPage.jsx` — audited navigation/flow cleanup retained.
- `frontend/src/Components/Dashboard/Profile.jsx` — Malawi profile/location cleanup.
- `frontend/src/Components/Dashboard/CreateAdForm.jsx` — active categories plus Malawi District / City-Town location wording/data.
- `frontend/src/Components/FreshRecommendations/FreshRecommendations.jsx` — Malawi location dataset adoption.
- `frontend/src/Data/malawiLocations.js` — Malawi locations added.
- `frontend/src/Data/indiaCities.js` — removed.
- `frontend/src/images/default-avatar.webp` — lightweight default avatar added.
- legacy oversized default avatar PNG — removed.
- `frontend/src/utils/avatar.js` — new default-avatar mapping.
- `frontend/vite.config.js` — local API proxy set to `127.0.0.1:5000`.

## Admin
- `admin/vite.config.js` — local API proxy set to `127.0.0.1:5000` for consistent Windows/Node local development behavior.

## Documentation
Added/updated:
- `README_FINAL_RELEASE.md`
- `FINAL_RELEASE_MANIFEST.txt`
- `docs/MASTER_AUDIT_REPORT_2026-09-13.md`
- `docs/AUDIT_FEATURE_MATRIX_2026-09-13.md`
- `docs/SECURITY_AUDIT_2026-09-13.md`
- `docs/FINAL_VALIDATION_REPORT_2026-09-13.md`
- `docs/UAT_CHECKLIST_2026-09-13.md`
- `docs/CHANGE_REGISTER_2026-09-13.md`
