import BaseGateway from "./baseGateway.js";
import { PAYMENT_GATEWAYS } from "../../../constants/paymentGateways.js";
import { env } from "../../../config/env.js";

export default class BankGateway extends BaseGateway {
  constructor() {
    super({ code: PAYMENT_GATEWAYS.BANK, name: "National Bank Transfer", supportsWebhook: false, supportsPolling: false });
  }

  describe() {
    return { ...super.describe(), mode: "manual-pop-verification", bankName: env.BANK_DISPLAY_NAME };
  }

  getBankInstructions() {
    return {
      bankName: env.BANK_DISPLAY_NAME,
      accountName: env.BANK_ACCOUNT_NAME,
      accountNumber: env.BANK_ACCOUNT_NUMBER,
      branch: env.BANK_BRANCH,
    };
  }

  async initiatePayment({ payment, plan }) {
    const bankDetails = this.getBankInstructions();
    const normalizedResponse = {
      paymentId: String(payment._id),
      merchantTransactionId: payment.merchantTransactionId,
      paymentReference: payment.paymentReference,
      gateway: PAYMENT_GATEWAYS.BANK,
      status: "pending",
      verificationStatus: "pending_verification",
      gatewayTransactionId: "",
      bankDetails,
      amount: Number(payment.amount || 0),
      currency: payment.currency || "MWK",
      planName: plan?.name || "",
      customerMessage: "Transfer the exact amount to the National Bank account and upload your Proof of Payment for verification.",
    };

    return {
      payerMsisdn: "",
      rawRequestPayload: { paymentReference: payment.paymentReference, amount: payment.amount, currency: payment.currency },
      rawResponsePayload: { bankInstructions: bankDetails },
      normalizedResponse,
    };
  }
}
