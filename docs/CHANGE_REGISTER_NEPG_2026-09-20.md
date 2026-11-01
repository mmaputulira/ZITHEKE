# Zitheke.com — NEPG Payment Integration Change Register

Date: 20 September 2026

## Scope

Added National Electronic Payment Gateway (NEPG) as an additional checkout option while retaining the existing Airtel Money and National Bank transfer / Proof of Payment flows.

## Customer checkout

- Added an NEPG payment card to the existing checkout screen.
- NEPG is controlled by `VITE_NEPG_ENABLED` so it can remain hidden until NBM test credentials are configured.
- Selecting NEPG creates the normal Zitheke subscription/payment record, registers the order with NEPG and redirects the customer to the NEPG `formUrl` hosted payment page.
- Added a branded transition screen before redirecting, including `Powered by Restock Tech`.
- Added `/checkout/nepg/return`, which safely verifies the order when the customer returns and refreshes subscription access after a verified payment.
- Airtel Money and National Bank options remain available and unchanged in purpose.

## Backend integration

- Added `nepg` to the supported payment gateways.
- Added an NEPG gateway adapter using:
  - `POST /auth/token`
  - `POST /order/make-order`
  - `POST /order/check-order-status`
- Added Bearer-token and `X-API-Key` authentication headers for secured calls.
- Added access-token caching based on `expires_in`.
- Added hosted payment URL validation and HTTPS enforcement.
- Added order ID persistence and safe reuse of an existing pending NEPG order.
- Added amount/currency verification before a successful NEPG response can activate a seller subscription or advert boost.
- Added NEPG to automatic payment reconciliation when `NEPG_ENABLED=true`.
- Added NEPG to payment verification and admin system-health visibility.

## NEPG status handling

The supplied NBM document explicitly demonstrates:

- `ErrorCode = 0` with `OrderStatus = 2` as a processed payment.
- `OrderStatus = 6` as a declined payment.

Only those documented final states are treated as final. Any other undocumented status combination remains pending until the full NBM status-code catalogue is supplied. This prevents an unknown status from activating a paid service incorrectly.

## Configuration

Backend `.env` values required before enabling:

```env
NEPG_ENABLED=true
NEPG_BASE_URL=https://<NBM-NEPG-HOST>/api/v1
NEPG_CLIENT_ID=<provided-by-NBM>
NEPG_CLIENT_SECRET=<provided-by-NBM>
NEPG_API_KEY=<provided-by-NBM>
NEPG_CURRENCY_CODE=454
NEPG_RETURN_URL=https://<zitheke-domain>/checkout/nepg/return
NEPG_DEFAULT_PAYMENT_METHOD=CARD
NEPG_TIMEOUT_MS=20000
```

Frontend:

```env
VITE_NEPG_ENABLED=true
```

Do not commit live credentials to source control.

## Important API-document limitation

The provided NEPG document gives `CARD` as the sample `payment_method` but does not define NEPG payment-method identifiers for Airtel Money or National Bank transfer. The implementation therefore uses the documented `CARD` method for NEPG and keeps Zitheke's existing Airtel Money and National Bank flows as separate checkout choices.

## Validation completed

- JavaScript syntax checks passed for the modified backend service files.
- TypeScript parser validation completed across 363 JS/TS/JSX/TSX source files with no parse diagnostics.
- A live NEPG end-to-end payment was not run because the uploaded documentation does not contain the environment host/IP, client ID, client secret or API key.
