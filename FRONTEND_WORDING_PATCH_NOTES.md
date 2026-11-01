# Zitheke Frontend — Human-Readable Customer Copy Patch

Release: 2026-09-09

This is a frontend-only wording/presentation patch based on the latest Zitheke production release.
No payment, subscription, advert-boost, Airtel Money, National Bank POP, MPGS, authentication, or marketplace business logic was changed.

## Main customer-facing changes

### Subscription / boost checkout
- “Choose your preferred payment method.” → “Choose how you would like to pay.”
- Technical payment-reference wording simplified.
- Seller-plan activation wording now says the plan activates once payment is confirmed.
- Advert-boost activation wording now says the selected advert is boosted once payment is confirmed.
- “Package and amount are validated by the backend.” → “Your selected package and payment amount are confirmed before payment.”
- Removed customer-facing references to frontend/backend processing.

### Airtel Money
- Replaced backend-verification language with simple payment-confirmation language.
- “Verifying with backend” → “Confirming your payment”.
- “Verify” progress step → “Confirm”.
- Success messages now say payment has been confirmed.

### Mastercard
- Removed hosted-session/backend terminology from customer instructions.
- Checkout steps now explain the customer journey in plain language.
- “Verification Status” → “Payment Status”.
- Technical session-start errors replaced with customer-friendly retry messages.

### National Bank / POP
- “Awaiting verification” → “Awaiting review”.
- POP notes now refer to helping Zitheke confirm the payment.

### Account/security messages
- OTP verification wording changed to simple code-confirmation wording.
- Password-reset session wording replaced with customer-friendly language.
- Removed a leftover login debug console message.

## Adoption

Option A — Replace the existing `frontend` folder with the `frontend` folder included in this ZIP.

Option B — Copy the updated `frontend/src` over the existing latest production frontend source.

Then run:

```powershell
cd frontend
npm install
npm run dev
```

For a production build:

```powershell
npm run build
```

## Important
This patch should be applied to the 2026-09-09 production release or a direct descendant of it. It is not intended for older Zitheke branches.
