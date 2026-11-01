# NEPG UAT Checklist — Zitheke.com

Use NBM test credentials and test environment only until all cases pass.

1. Configure the backend NEPG variables and set `NEPG_ENABLED=true`.
2. Set `VITE_NEPG_ENABLED=true` and rebuild the frontend.
3. Open a paid seller plan or advert boost and confirm all three choices are visible: NEPG, Airtel Money and National Bank.
4. Select NEPG and confirm Zitheke creates one payment reference and redirects only to the HTTPS `formUrl` returned by NEPG.
5. Complete a successful NEPG test payment and confirm the return page verifies it, records the NEPG order/reference, marks the payment paid/verified and activates only the linked service.
6. Test a declined payment and confirm it does not activate the service.
7. Abandon a hosted payment and confirm it remains pending rather than becoming paid.
8. Retry a pending NEPG payment and confirm Zitheke reuses the valid pending order instead of generating unnecessary duplicates during the reuse window.
9. Confirm a successful status with a mismatching amount or currency is blocked from activation.
10. Confirm payment history and admin reconciliation display the NEPG record.
11. Confirm Airtel Money still sends its existing wallet flow and National Bank still uses the existing transfer + Proof of Payment review flow.
12. Confirm no NEPG client secret, API key, access token or service-account credential appears in browser responses, logs intended for users, or the release ZIP.

Go-live dependency: obtain the NBM test endpoint/IP, `client_id`, `client_secret`, `api_key`, and the complete NEPG status/payment-method catalogue if additional NEPG methods beyond `CARD` are required.
