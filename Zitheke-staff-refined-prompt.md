# Refined implementation request

Extend the existing Zitheke Backend, Admin and Frontend projects without rebuilding their architecture. Use worksheet 2, “Zitheke”, in the supplied job-role workbook as the source of staff identities and role assignments. Combine multiple assignments for the same email into one staff account with multiple roles. Keep the Technical/System Support role available but do not invent an email for Restock Tech.

Implement a documented permission matrix for all ten job roles. Distinguish finance/reconciliation from payment verification, marketplace operations from advert moderation and category/content work, and investigative risk access from enforcement. Give only the Super Administrator staff-management and permanent-purge permissions. Make reporting read-only and technical support limited to system-health/audit work. Remove the generic Admin privilege bypass.

Enforce current database permissions on every protected Admin API, deny unknown APIs, protect direct frontend routes, and display only permitted menu items. Keep role changes effective for existing sessions and provide a multi-role staff-management screen with self-demotion/last-Super-Administrator safeguards. Preserve existing audit logging and buyer/merchant enforcement.

Provide a dry-run staff-assignment script with an exact email roster, missing/unassigned-account reports, role snapshot and rollback. Apply only explicit matching identities; provide secure individual provisioning without shared/default passwords. Do not change production accounts during development.

Add “Powered by Restock Tech” to the common frontend footer using the supplied official PNG unchanged. Fit it responsively into Zitheke's existing indigo/gold palette, retain its proportions, and handle the surrounding image whitespace through layout styling.

Verify API permission boundaries, multi-role unions, immediate role removal, roster apply/rollback, route/menu consistency, builds and frontend branding. Deliver an Admin+Backend ZIP and an updated Frontend ZIP containing source, lockfiles, production bundles, tests, assignment scripts, the permission matrix and deployment instructions. Exclude private credentials and local dependency/cache folders.
