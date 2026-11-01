# Zitheke staff access and Restock Tech branding

This release extends the completed buyer/seller project. The source of staff assignments is worksheet 2, **Zitheke**, rows 5–14 in `Job Role Alinafe Capital & Zitheke.xlsx`. The workbook was read without modifying it. Role names, names and email assignments were treated as source data; no instructions inside the workbook were executed.

## Staff assignments

| Staff member | Account email | Assigned roles |
| --- | --- | --- |
| Moses Chirambo | moizmsanda@gmail.com | Super Administrator |
| Billiat Chikalusa | billiatchikalusa@gmail.com | Marketplace Operations Manager; Advert Moderation Officer; Customer Service Officer; Category & Content Manager |
| Precious Mkandawire | preciousmkandawire@gmail.com | Finance & Reconciliation Officer |
| Roselyn Milanzi | roselyncmchirambo@gmail.com | Payment Verification Officer |
| Emily Sikelo | emilysikelo@gmail.com | Payment Verification Officer; Reporting & MIS Officer |
| Kondwani Kadzakumanja | kondwanikadzakumanja2@gmail.com | Advert Moderation Officer; Customer Service Officer; Reporting & MIS Officer |
| John Kango | kangojohn2020@gmail.com | Risk & Fraud Review Officer |
| Restock Tech | Not supplied in the workbook | Technical / System Support Administrator — role implemented; identity remains unassigned |

The two shared-name rows were resolved by their listed email identities, trimming spaces and combining repeated assignments. Each staff account can hold several job roles. Permissions are their union; no duplicate accounts or shared passwords are introduced.

## Access rules adopted

The worksheet provides titles and assignments, not a detailed permission specification. The following least-privilege rules are implementation choices based on those titles and the existing modules:

| Job role | Allowed work | Restricted work |
| --- | --- | --- |
| Super Administrator | All classified modules, staff role assignments, permanent purges | Cannot remove own Super Administrator access or the last active Super Administrator; unknown APIs remain denied |
| Marketplace Operations Manager | Marketplace overview, account lifecycle and merchant review, listing management/moderation, orders, categories, plans/pricing, support, notifications | No bank-payment verification, financial recovery, staff grants, or system administration |
| Finance & Reconciliation Officer | Reconciliation, subscription/payment reporting, read-only verification queue and POP evidence, verified-payment recovery and expiry synchronization | Cannot approve/reject POP, change prices, moderate listings, or assign staff roles |
| Payment Verification Officer | POP queue/evidence and approve/reject payment evidence | No financial recovery, reconciliation exports, prices, marketplace moderation, or staff grants |
| Advert Moderation Officer | Listing review and approval/rejection/bulk moderation, related accounts/categories/report review | No pricing, bank payment actions, general chat monitoring, or staff grants |
| Risk & Fraud Review Officer | Risk signals, investigative account/listing/report review, conversations and audit log; report status review | No financial actions, account suspension, pricing, or staff grants; escalates enforcement to Marketplace/Super Administrator |
| Customer Service Officer | Customer accounts read-only, buyer purchase overview, support/inbox, conversations, report status and notifications | No merchant approval/lifecycle change, POP decisions, pricing, or staff grants |
| Category & Content Manager | Categories and listing content management, notifications | No listing moderation decisions, financial actions, pricing, or staff grants |
| Reporting & MIS Officer | Overview analytics, revenue/subscription reporting, reconciliation, orders, listing/category data and audit log | No operational or financial mutations |
| Technical / System Support Administrator | System health and audit log | No product pricing, customer/financial operations, payment verification, or staff grants |

Every assigned staff member can manage their own profile/settings. Staff login email changes require Super Administrator permission to prevent self-service claims on roster identities. Technical support has no live console or infrastructure credential access through this application. Risk review has no new case-management workflow beyond the existing risk/report modules. MIS reporting uses the existing reporting/export modules; it is not a new external reporting platform.

`adminAccess.json` defines permissions and page mappings. Identical copies are included in Backend and Admin and tested for consistency. The Backend classifies every protected Admin request, denies unknown paths and reads current assignments from the database on every request. Old token claims cannot retain removed roles. The Admin confirms its permissions from the server before rendering menus/pages and refreshes on focus and every minute. Direct URLs have guards as well as API enforcement. Key payment, pricing, moderation and account controls respect read/write access.

The old generic `admin` role **does not grant full access**. Unmapped legacy accounts need explicit assignment; the dry-run roster report identifies them. Only `super_admin` grants all recognized permissions. Existing business-role accounts retain their recognized legacy single role until an explicit multi-role assignment is applied. The staff page prevents accidental self-demotion and removal of the last active Super Administrator.

Seller history excludes payment data for staff without finance or marketplace oversight. Session IP/device details are restricted to Super Administrator and Risk review. Mutations continue to use the existing audit logging mechanism.

## Branding

The exact supplied `LogoTransparent_.png` is included as `frontend/public/branding/restock-tech-official.png`. “Powered by” remains in the common frontend footer. A responsive white inset with rounded corners and layout-only whitespace cropping presents the blue logo beside the existing indigo/gold branding. The source image is not recolored or regenerated. The common footer covers existing public pages and the buyer area where MainLayout is used; standalone authentication screens retain their existing layout.

## Deployment and staff activation

Both the Admin and Backend must be deployed together. Frontend branding is in the separate frontend package. Previous buyer/seller changes are retained. Restore secured deployment environment files/Firebase credentials separately; they are excluded from the ZIPs. Install dependencies with `npm ci`. Fresh Admin and Frontend production bundles are included.

1. Back up the production database, application, uploads and configuration. Verify the release on staging first.
2. With the new Backend source available, run `npm run assign:staff` from the Backend directory using the intended `MONGO_URI`. This is a dry-run and lists existing matches, missing roster accounts, and unassigned accounts.
3. Ensure Moses' named Super Administrator account exists before switching the live API. For a missing listed identity, an operator may provision one account with `npm run assign:staff -- --apply --provision <listed-email>`, supplying a unique password of at least 12 characters in the secured `ZITHEKE_STAFF_PASSWORD` environment variable. The script will not print/store the plaintext password, reset existing passwords, or create every account with a shared default. Deliver credentials through the organization's normal secure process; clear that environment variable afterward.
4. Run `npm run assign:staff -- --apply`. It snapshots existing role fields to `backend/backups/staff-role-snapshot-<timestamp>.json`, assigns the exact roster roles to matching emails, and leaves other accounts untouched. Missing accounts are reported, not silently invented. Re-run after provisioning missing listed staff.
5. Deploy the matching Backend/Admin release and verify Moses can manage staff roles. Review all unassigned legacy accounts explicitly. Restock Tech's actual authorized email must be supplied/registered before assigning the Technical role; none is inferred from the workbook.
6. Test each staff identity in staging against its intended menu and direct API actions. Deploy the new frontend bundle and check the footer at desktop/mobile widths. No production accounts or production database were changed during this task.

For pre-traffic rollback, keep writes closed, restore the previous code and run `npm run assign:staff -- --apply --rollback backups/<staff-role-snapshot>.json` against the same database. This restores existing role fields only. It does not remove newly provisioned accounts or undo later staff changes. Use the full pre-release database backup for wider recovery.

If upgrading from the original archive rather than the prior buyer/seller release, also follow the marketplace migration instructions in `Zitheke-release-notes.md`. The staff assignment script is separate from that migration and never runs automatically at server startup.

## Verification

Frontend and Admin production builds passed. The isolated Backend integration suite passed 12 tests (11 scenarios and the parent test), including worksheet role unions, direct API denials, payment/finance separation, technical restrictions, live role removal, self-demotion protection, policy-copy consistency and roster apply/rollback, alongside all previous buyer/seller checks. Browser inspection confirmed the supplied logo in the frontend footer, the Technical role's Audit/System Health/Settings-only menu, and denial of its direct payment-verification URL.

Live staff accounts, production deployment and real payment-provider operations have not been exercised. Deployment must apply the roster explicitly; packaging does not change the live database. The earlier audit and buyer/seller release notes describe the preceding release; this document takes precedence for Admin staff access.
