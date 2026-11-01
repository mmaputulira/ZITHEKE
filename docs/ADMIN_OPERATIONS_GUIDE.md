# Zitheke Marketplace Operations Centre — Admin Guide

## 1. Dashboard
Use the Admin landing page for a daily operational snapshot: revenue, payments requiring attention, active seller subscriptions, active/expiring boosts, pending adverts, inactive users, support issues and system alerts.

## 2. Finance & Reconciliation
Open **Reconciliation** to filter transactions by date window, payment method, service type, status, seller/reference/package/advert. Review:
- expected amount
- customer claimed/recorded amount
- verified amount received
- difference
- payment reference
- subscription/boost ID
- linked advert where applicable
- verification and service activation status

Export the filtered window to CSV or Excel-compatible format for finance/bank reconciliation.

## 3. Payment Verification
For National Bank POPs:
- review the payment reference, package/service and linked advert if applicable
- compare expected and claimed amounts
- inspect the bank reference and POP
- approve only after sufficient evidence
- reject/request replacement with a clear reason

Uploading a POP by itself never activates a seller plan or advert boost.

## 4. Manual Payment Recovery
Use only when the payment is already **Paid + Verified** but the linked subscription/boost failed to activate. A reason is mandatory and the recovery action is audit logged. Do not use this as a substitute for payment verification.

## 5. Plans & Pricing
Admin can Add, Edit, Hide/Show and Delete plans. Prices are stored as numeric MWK values even though the UI displays comma separators. Existing paid records retain their transaction history.

## 6. Categories
Use Add/Edit/Hide/Delete controls. Prefer **Hide** where historical adverts depend on a category.

## 7. Advert Moderation
Available review states include Pending, Approved, Needs Editing, Rejected, Flagged, Suspended, Sold and Archived. Use bulk actions only after reviewing the selected records.

## 8. Users & Sellers
Lifecycle states include Active, Inactive, Under Review and Suspended. Suspending a user revokes active sessions where supported. Use **Seller 360°** to inspect listings, subscriptions/boosts, payments, reports and activity before making high-impact decisions.

## 9. Inbox & Messages
Delete moves eligible records to **Trash** first. Trash retention is 30 days before permanent cleanup. Restore records when needed during the retention period.

## 10. Risk, Reports and Support
- **Risk & Fraud:** review Low/Medium/High indicators; flags support human review and do not automatically ban sellers.
- **Reported Listings:** investigate marketplace complaints and suspicious adverts.
- **Support & Disputes:** manage payment, POP, seller and advert-related support cases.

## 11. Notifications
Publish customer-facing notices to the supported audiences. Use urgent severity sparingly.

## 12. Roles and Permissions
Roles:
- Super Admin
- Admin
- Finance
- Marketplace
- Moderator
- Support
- Reporting

The backend enforces role restrictions; the sidebar only reflects the permissions available to the signed-in administrator.

## 13. Audit Log
Financial approvals, payment recovery, moderation, account restrictions, plan/category changes and access changes should remain attributable to the administrator who performed them.

## 14. System Health
Review API/database status, payment configuration, pending queues and scheduler state before escalating operational incidents.

## 15. Branding
Zitheke remains the primary marketplace brand. `Powered by Restock Tech` is displayed discreetly. On navy/dark surfaces the dedicated white Restock Tech logo asset is used for visibility.
