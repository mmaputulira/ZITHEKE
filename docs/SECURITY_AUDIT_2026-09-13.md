# Zitheke Security Audit Notes — 13 September 2026

## Security improvements applied

- Advert ownership is derived from the authenticated identity.
- Protected listing fields are stripped from seller create/update payloads.
- Public advert visibility is restricted to approved marketplace records.
- Search regex values are escaped and public limits are bounded.
- Socket conversation join, typing and seen/read behavior now checks authenticated identity/participation.
- Normal authorization denials no longer destroy otherwise valid customer sessions.
- Firebase Admin credentials can be provided securely outside the source tree.
- Dead code referencing a missing model was removed.
- The final release package excludes live `.env`, service-account JSON, private keys, Git metadata, runtime uploads, `node_modules` and build output.

## Important remaining security work

### Refresh token architecture
The customer web application still uses browser storage for access/refresh token handling. A stronger production architecture is a short-lived access token plus a Secure, HttpOnly, SameSite refresh cookie, with explicit CSRF/session controls. This should be implemented as a planned authentication migration rather than as an untested last-minute patch.

### Dependency findings
The user's local backend `npm install` reported dependency vulnerabilities. Run on the deployment/test host:

```bash
cd backend
npm audit
npm audit --omit=dev
```

Remediate compatible fixes deliberately. Do **not** blindly execute `npm audit fix --force`, because major-version upgrades can break payment, auth or database behavior.

### Payment/UAT protections to reconfirm
- No card number/CVV storage.
- Airtel access tokens are not persisted in customer-visible/raw payment records.
- NBM POP files remain private and authorized.
- Duplicate payment verification is idempotent.
- Advert boost activation cannot be redirected to a different advert.
- Admin RBAC is enforced server-side, not only through hidden UI links.
- Suspended users lose active access as designed.

## Secret handling

No live `.env`, service-account JSON, private-key files, runtime uploads or POP evidence are included in this release tree. The backend `.env.example` contains placeholders only. Firebase browser configuration is client configuration and must still be protected by proper Firebase Auth/domain/rules configuration; it is not a substitute for server-side authorization.
