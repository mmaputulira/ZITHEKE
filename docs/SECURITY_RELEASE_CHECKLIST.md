# Security Release Checklist

Before production:
- [ ] Rotate credentials previously present in development/shared archives.
- [ ] Supply production secrets through environment variables or a secret manager only.
- [ ] Confirm `.env`, private keys, service-account files and private POP files are excluded from source archives.
- [ ] Enforce HTTPS/TLS.
- [ ] Restrict CORS to approved production origins.
- [ ] Confirm rate limits on authentication, payment and upload endpoints.
- [ ] Confirm backend validates POP file type/signature and size.
- [ ] Confirm users cannot access another user's private POP.
- [ ] Confirm frontend cannot directly activate seller subscriptions/boosts.
- [ ] Confirm Socket.IO membership is authorised server-side.
- [ ] Confirm Admin endpoints enforce RBAC server-side.
- [ ] Confirm finance approval/recovery actions are idempotent and audit logged.
- [ ] Confirm raw payment secrets/access tokens/card data are not persisted or logged.
- [ ] Confirm Admin audit metadata redacts passwords, tokens and gateway-sensitive fields.
- [ ] Confirm account suspension/revocation invalidates sessions as intended.
- [ ] Confirm Trash-retention cleanup cannot delete records outside its approved scope.
- [ ] Run `npm audit` on the deployment host and resolve production-critical findings.
- [ ] Run frontend and Admin production builds successfully.
- [ ] Back up production MongoDB before migration/go-live.
