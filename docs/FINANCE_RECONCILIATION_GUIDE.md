# Finance & Reconciliation Guide

## Reconciliation window
Filter by:
- Date From / Date To
- Payment method/channel
- Payment status
- Service type: Seller Subscription or Advert Boost
- Package
- Customer/seller
- Payment reference
- Subscription/Boost ID
- Advert where applicable

## Transaction fields
Review:
- transaction date/time
- customer/seller
- service/package
- advert where applicable
- payment reference
- subscription/boost ID
- expected amount
- claimed/recorded amount
- verified amount received
- difference
- currency
- payment method
- bank/gateway reference
- POP/verification status
- service activation status
- verified by / verified at

## Totals
The reconciliation summary should distinguish:
- transaction count
- verified received amount
- pending amount/records
- reconciliation difference

A customer-uploaded POP amount must not be treated as verified revenue before payment verification.

## Export
Use CSV or Excel-compatible export on the filtered date window. Preserve the exact filter criteria used when sharing a reconciliation report.

## Exceptions requiring review
- successful/verified payment but service not activated
- amount mismatch
- duplicate/reused references
- pending payment older than the operational SLA
- rejected/replacement POP
- missing payment-to-subscription/boost linkage

## Manual recovery
Only an authorised Finance/Admin role may recover a linked service after the underlying payment is already Paid and Verified. Every recovery requires a reason and audit trail.
