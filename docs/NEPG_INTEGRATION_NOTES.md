# NEPG integration notes

Implemented from the supplied **NEPG NBM Integration – Third-Party Integration API Documentation (API v1)**.

## Implemented flow

1. Backend obtains an access token with `POST /auth/token`.
2. Backend registers the order with `POST /order/make-order`.
3. Zitheke redirects the customer to the returned `formUrl`.
4. NEPG returns the customer to `/checkout/nepg/return?paymentId=...`.
5. Zitheke verifies the order with `POST /order/check-order-status` before activating the purchased service.

## Important status handling

The supplied document explicitly shows **OrderStatus 2** for a successful payment and **OrderStatus 6** for a rejected payment. The code therefore treats only status 2 as paid and status 6 (or a non-zero `ErrorCode`) as failed. Any other undocumented order status remains pending until NBM supplies the complete status-code list. This prevents an unknown status from activating a paid service.

## Required backend environment values

```env
NEPG_ENABLED=true
NEPG_BASE_URL=https://YOUR_NEPG_HOST/api/v1
NEPG_CLIENT_ID=
NEPG_CLIENT_SECRET=
NEPG_API_KEY=
NEPG_CURRENCY_CODE=454
NEPG_RETURN_URL=https://zitheke.com/checkout/nepg/return
NEPG_DEFAULT_PAYMENT_METHOD=CARD
NEPG_TIMEOUT_MS=20000
```

Frontend feature flag:

```env
VITE_NEPG_ENABLED=true
```

`CARD` is used because that is the only `payment_method` value explicitly demonstrated in the supplied integration document. Existing **Airtel Money** and **National Bank transfer + POP** options remain available separately in the checkout.

## Go-live dependency

The integration code is complete, but a real end-to-end transaction cannot be executed until NBM provides the NEPG host/IP, client ID, client secret and API key for the intended environment.
