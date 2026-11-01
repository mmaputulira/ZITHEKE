# Production UAT Checklist

## Monetary entry and formatting
- [ ] Make Offer displays commas while typing (e.g. 15,222,222).
- [ ] Counter Offer displays commas while typing.
- [ ] Create Advert price displays commas while typing.
- [ ] Edit Advert price displays commas while typing.
- [ ] Price filters display comma-formatted monetary entry.
- [ ] Admin plan price entry displays commas while retaining a numeric payload.
- [ ] Database/API values remain numeric after formatted entry.

## Seller account subscription
- [ ] Free/Simple Start/Essentials/Plus/Advanced (or current Admin-configured plans) display correctly.
- [ ] Seller can select an account-level plan.
- [ ] Airtel Money verifies and membership activates.
- [ ] NBM POP approval activates membership only after verification.
- [ ] Current plan/expiry appears in My Marketplace.

## Advert-specific boost
- [ ] Seller can boost an owned Approved advert only.
- [ ] Payment remains linked to the selected advert.
- [ ] Another seller's advert cannot be boosted.
- [ ] Airtel/NBM verification activates only the linked advert.
- [ ] Boost expires without removing the original listing.
- [ ] Boost Performance reports gains and remaining days.

## Buyer engagement
- [ ] Save/unsave item.
- [ ] Follow/unfollow seller.
- [ ] Create a price alert and detect a price drop.
- [ ] Make offer; seller accept/decline/counter; buyer accept/withdraw.
- [ ] Chat emoji labels and visible strings render correctly (no mojibake characters).

## Finance/Admin reconciliation
- [ ] Date From / Date To filters work.
- [ ] Payment method/service/status/search filters work.
- [ ] Expected, claimed, verified and difference fields are correct.
- [ ] Summary totals match the filtered transactions.
- [ ] CSV export opens correctly.
- [ ] Excel-compatible export opens correctly.
- [ ] NBM POP approve/reject/replacement flow works.
- [ ] Manual recovery is blocked unless payment is Paid + Verified.
- [ ] Successful recovery cannot double-activate the service.

## Admin operations
- [ ] Plans: add/edit/hide/show/delete safeguards.
- [ ] Categories: add/edit/hide/delete safeguards.
- [ ] Advert moderation individual actions.
- [ ] Bulk approve/reject/request changes/flag.
- [ ] User Active/Inactive/Under Review/Suspended lifecycle.
- [ ] Seller 360° loads seller operational data.
- [ ] Inbox Trash and restore.
- [ ] Messages Trash and restore.
- [ ] 30-day retention date is recorded/handled as intended.
- [ ] Risk Flags loads.
- [ ] Reported Listings loads.
- [ ] Support & Disputes loads.
- [ ] Notifications can be published and received by the intended audience.
- [ ] Audit Log records sensitive admin actions.
- [ ] System Health loads.
- [ ] Admin Access role changes apply after re-login.

## RBAC
- [ ] Moderator cannot perform finance approval/recovery.
- [ ] Finance cannot obtain destructive marketplace permissions unless separately authorised.
- [ ] Support cannot access restricted finance functions.
- [ ] Reporting is read-oriented.
- [ ] Super Admin/Admin permissions behave as approved.

## Branding and responsive UX
- [ ] Original Restock Tech logo is legible on light surfaces.
- [ ] White Restock Tech logo is legible on dark/navy Admin surfaces.
- [ ] Zitheke remains the primary visual brand.
- [ ] Public and Admin navigation remains usable on mobile.
- [ ] Admin wide tables remain usable via responsive layout/horizontal scroll.
- [ ] Customer-facing wording contains no unnecessary backend/API jargon.
- [ ] Branded dialogs replace primitive browser prompts in updated flows.
