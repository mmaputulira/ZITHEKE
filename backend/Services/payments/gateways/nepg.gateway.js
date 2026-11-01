import axios from "axios";
import BaseGateway from "./baseGateway.js";
import { PAYMENT_GATEWAYS } from "../../../constants/paymentGateways.js";
import { env } from "../../../config/env.js";

let cachedToken = "";
let cachedTokenExpiresAt = 0;

const asTrimmedString = (value) => String(value ?? "").trim();

const createGatewayError = ({ message, statusCode = 502, code = "", gatewayMessage = "", rawRequest = null, rawResponse = null }) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.gatewayCode = code;
  error.gatewayMessage = gatewayMessage || message;
  error.rawRequest = rawRequest;
  error.rawResponse = rawResponse;
  return error;
};

export default class NepgGateway extends BaseGateway {
  constructor() {
    super({
      code: PAYMENT_GATEWAYS.NEPG,
      name: "National Electronic Payment Gateway (NEPG)",
      supportsWebhook: false,
      supportsPolling: true,
    });
  }

  describe() {
    return {
      ...super.describe(),
      mode: "hosted-payment-page",
      endpoints: {
        token: "/auth/token",
        registerOrder: "/order/make-order",
        checkOrderStatus: "/order/check-order-status",
      },
    };
  }

  getRuntimeConfig() {
    return {
      enabled: env.NEPG_ENABLED,
      baseUrl: env.NEPG_BASE_URL,
      clientId: env.NEPG_CLIENT_ID,
      clientSecret: env.NEPG_CLIENT_SECRET,
      apiKey: env.NEPG_API_KEY,
      currencyCode: env.NEPG_CURRENCY_CODE,
      returnUrl: env.NEPG_RETURN_URL,
      defaultPaymentMethod: env.NEPG_DEFAULT_PAYMENT_METHOD || "CARD",
      timeoutMs: env.NEPG_TIMEOUT_MS,
    };
  }

  assertConfigured() {
    const config = this.getRuntimeConfig();
    if (!config.enabled) {
      const error = new Error(
        "NEPG is disabled. Enable NEPG_ENABLED after the NBM test credentials and endpoint have been supplied."
      );
      error.statusCode = 409;
      throw error;
    }

    if (!config.baseUrl || !config.clientId || !config.clientSecret || !config.apiKey) {
      const error = new Error(
        "NEPG is not fully configured. Set NEPG_BASE_URL, NEPG_CLIENT_ID, NEPG_CLIENT_SECRET and NEPG_API_KEY."
      );
      error.statusCode = 500;
      throw error;
    }

    return config;
  }

  resolveReturnUrl(config, payment) {
    let baseReturnUrl = asTrimmedString(config.returnUrl);
    if (!baseReturnUrl && env.APP_BASE_URL) {
      baseReturnUrl = `${env.APP_BASE_URL.replace(/\/+$/, "")}/checkout/nepg/return`;
    }

    if (!baseReturnUrl) {
      const error = new Error(
        "NEPG return URL is not configured. Set NEPG_RETURN_URL or APP_BASE_URL before enabling NEPG."
      );
      error.statusCode = 500;
      throw error;
    }

    let parsed;
    try {
      parsed = new URL(baseReturnUrl);
    } catch {
      const error = new Error("NEPG_RETURN_URL must be a valid absolute http(s) URL.");
      error.statusCode = 500;
      throw error;
    }

    parsed.searchParams.set("paymentId", String(payment._id));
    return parsed.toString();
  }

  formatAmount(amount) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      const error = new Error("NEPG payment amount must be greater than zero.");
      error.statusCode = 400;
      throw error;
    }
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  async getAccessToken(config) {
    const now = Date.now();
    if (cachedToken && cachedTokenExpiresAt > now + 60_000) {
      return cachedToken;
    }

    const url = `${config.baseUrl}/auth/token`;
    const body = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "client_credentials",
    };

    try {
      const response = await axios.post(url, body, {
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        timeout: config.timeoutMs,
      });
      const token = asTrimmedString(response?.data?.access_token);
      if (!token) {
        throw createGatewayError({
          message: "NEPG did not return an access token.",
          code: "NEPG_TOKEN_MISSING",
          rawResponse: response?.data || null,
        });
      }

      const expiresIn = Math.max(60, Number(response?.data?.expires_in || 3600));
      cachedToken = token;
      cachedTokenExpiresAt = now + expiresIn * 1000;
      return token;
    } catch (error) {
      if (error?.gatewayCode) throw error;
      throw createGatewayError({
        message: "Could not authenticate with NEPG.",
        statusCode: error?.response?.status || 502,
        code: "NEPG_AUTH_FAILED",
        gatewayMessage: error?.response?.data?.message || error?.message || "NEPG authentication failed",
        rawRequest: { url, grant_type: "client_credentials" },
        rawResponse: error?.response?.data || null,
      });
    }
  }

  buildSecuredHeaders(token, config) {
    return {
      Authorization: `Bearer ${token}`,
      "X-API-Key": config.apiKey,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }

  async initiatePayment({ payment, plan, user }) {
    const config = this.assertConfigured();
    const token = await this.getAccessToken(config);
    const url = `${config.baseUrl}/order/make-order`;
    const returnUrl = this.resolveReturnUrl(config, payment);
    const paymentMethod = asTrimmedString(payment?.paymentMethod || config.defaultPaymentMethod).toUpperCase();
    const body = {
      amount: this.formatAmount(payment.amount),
      currency: asTrimmedString(config.currencyCode || "454"),
      return_url: returnUrl,
      description: `Zitheke ${asTrimmedString(plan?.name || "payment")}`.slice(0, 160),
      email: asTrimmedString(user?.email),
      name: asTrimmedString(user?.name || user?.email || "Zitheke Customer"),
      payment_method: paymentMethod || "CARD",
    };

    try {
      const response = await axios.post(url, body, {
        headers: this.buildSecuredHeaders(token, config),
        timeout: config.timeoutMs,
      });
      const data = response?.data || {};
      const responseCode = String(data?.responseCode ?? "").trim();
      const orderId = asTrimmedString(data?.orderId);
      const formUrl = asTrimmedString(data?.formUrl);

      if (responseCode !== "0" || !orderId || !formUrl) {
        throw createGatewayError({
          message: asTrimmedString(data?.message) || "NEPG could not register the payment order.",
          code: responseCode || "NEPG_ORDER_REGISTRATION_FAILED",
          rawRequest: body,
          rawResponse: data,
        });
      }

      let hostedUrl;
      try {
        hostedUrl = new URL(formUrl);
      } catch {
        throw createGatewayError({
          message: "NEPG returned an invalid hosted payment URL.",
          code: "NEPG_INVALID_FORM_URL",
          rawRequest: body,
          rawResponse: data,
        });
      }
      if (hostedUrl.protocol !== "https:") {
        throw createGatewayError({
          message: "NEPG hosted payment URL must use HTTPS.",
          code: "NEPG_INSECURE_FORM_URL",
          rawRequest: body,
          rawResponse: data,
        });
      }

      const normalizedResponse = {
        paymentId: String(payment._id),
        merchantTransactionId: payment.merchantTransactionId,
        gateway: PAYMENT_GATEWAYS.NEPG,
        status: "initiated",
        verificationStatus: "pending",
        gatewayTransactionId: "",
        gatewayOrderId: orderId,
        rawGatewayStatus: responseCode,
        formUrl,
        redirectUrl: formUrl,
        customerMessage: "NEPG payment page is ready. Continue on the secure hosted page to complete payment.",
      };

      return {
        payerMsisdn: "",
        rawRequestPayload: { orderRegistration: body },
        rawResponsePayload: { orderRegistration: data },
        normalizedResponse,
      };
    } catch (error) {
      if (error?.gatewayCode) throw error;
      throw createGatewayError({
        message: "Could not register the payment with NEPG.",
        statusCode: error?.response?.status || 502,
        code: "NEPG_ORDER_REGISTRATION_FAILED",
        gatewayMessage: error?.response?.data?.message || error?.message || "NEPG order registration failed",
        rawRequest: body,
        rawResponse: error?.response?.data || null,
      });
    }
  }

  validateSuccessfulAmount(payment, data, config) {
    const expectedAmount = Number(payment.amount || 0);
    const receivedAmount = Number(data?.Amount ?? data?.depositAmount);
    const receivedCurrency = asTrimmedString(data?.currency);
    const expectedCurrency = asTrimmedString(config.currencyCode || "454");

    if (!Number.isFinite(receivedAmount) || receivedAmount !== expectedAmount) {
      throw createGatewayError({
        message: "NEPG returned a successful status with an amount that does not match the Zitheke payment record.",
        code: "NEPG_AMOUNT_MISMATCH",
        rawResponse: data,
      });
    }

    if (receivedCurrency && expectedCurrency && receivedCurrency !== expectedCurrency) {
      throw createGatewayError({
        message: "NEPG returned a successful status with a currency that does not match the configured currency.",
        code: "NEPG_CURRENCY_MISMATCH",
        rawResponse: data,
      });
    }
  }

  async verifyPayment({ payment }) {
    const config = this.assertConfigured();
    const orderId = asTrimmedString(payment?.gatewayOrderId);
    if (!orderId) {
      const error = new Error("No NEPG order ID is available for payment verification.");
      error.statusCode = 409;
      throw error;
    }

    const token = await this.getAccessToken(config);
    const url = `${config.baseUrl}/order/check-order-status`;
    const body = { order_id: orderId };

    try {
      const response = await axios.post(url, body, {
        headers: this.buildSecuredHeaders(token, config),
        timeout: config.timeoutMs,
      });
      const data = response?.data || {};
      const errorCode = String(data?.ErrorCode ?? "").trim();
      const orderStatus = Number(data?.OrderStatus);
      const orderNumber = asTrimmedString(data?.OrderNumber);

      let status = "pending";
      let verificationStatus = "pending";
      let customerMessage = asTrimmedString(data?.message) || "NEPG payment is still being processed.";

      // The supplied NBM document explicitly demonstrates OrderStatus 2 as successful
      // and OrderStatus 6 as rejected. Other values remain pending until NBM confirms
      // their meaning, preventing an undocumented status from activating a subscription.
      if (errorCode === "0" && orderStatus === 2) {
        this.validateSuccessfulAmount(payment, data, config);
        status = "paid";
        verificationStatus = "verified";
        customerMessage = asTrimmedString(data?.message) || "Payment processed.";
      } else if (orderStatus === 6) {
        status = "failed";
        verificationStatus = "failed";
        customerMessage =
          asTrimmedString(data?.ErrorMessage) ||
          asTrimmedString(data?.message) ||
          "NEPG payment was declined.";
      } else if (errorCode && errorCode !== "0") {
        // The supplied document does not define every ErrorCode/OrderStatus pair.
        // Keep undocumented combinations pending rather than treating them as paid or failed.
        customerMessage =
          asTrimmedString(data?.ErrorMessage) ||
          asTrimmedString(data?.message) ||
          "NEPG has not returned a final documented payment status yet.";
      }

      return {
        rawRequestPayload: body,
        rawResponsePayload: data,
        normalizedResponse: {
          paymentId: String(payment._id),
          merchantTransactionId: payment.merchantTransactionId,
          gateway: PAYMENT_GATEWAYS.NEPG,
          status,
          verificationStatus,
          gatewayTransactionId: orderNumber || payment.gatewayTransactionId || "",
          gatewayOrderId: orderId,
          rawGatewayStatus: Number.isFinite(orderStatus) ? String(orderStatus) : "",
          gatewayCode: errorCode,
          customerMessage,
        },
      };
    } catch (error) {
      if (error?.gatewayCode) throw error;
      throw createGatewayError({
        message: "Could not verify the payment with NEPG.",
        statusCode: error?.response?.status || 502,
        code: "NEPG_VERIFICATION_FAILED",
        gatewayMessage: error?.response?.data?.message || error?.message || "NEPG verification failed",
        rawRequest: body,
        rawResponse: error?.response?.data || null,
      });
    }
  }
}
