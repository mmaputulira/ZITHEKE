import api from "../api/axios";

export const PAYMENT_GATEWAYS = {
  AIRTEL_MONEY: "airtel_money",
  NEPG: "nepg",
  MASTERCARD: "mastercard",
  BANK: "bank",
};

export const PAYMENT_METHODS = {
  AIRTEL_MONEY: "airtel_money",
  NEPG_CARD: "CARD",
  MASTERCARD: "mastercard",
  NATIONAL_BANK: "national_bank_transfer",
};

export const listMembershipPlans = async () => {
  const { data } = await api.get("/plans");
  return Array.isArray(data?.plans) ? data.plans : [];
};

export const getPlanBySlug = async (slug) => {
  const { data } = await api.get(`/plans/${slug}`);
  return data?.plan || null;
};

export const getMembershipAccess = async () => {
  const { data } = await api.get("/subscriptions/me/access");
  return data?.access || null;
};

export const createSubscriptionIntent = async (planId, adId = null, scope = "ad_boost") => {
  const payload = { planId, scope };
  if (adId) payload.adId = adId;
  const { data } = await api.post("/subscriptions", payload);
  return data?.subscription || null;
};

export const createAirtelPaymentIntent = async ({ subscriptionId, msisdn, idempotencyKey }) => {
  const { data } = await api.post("/payments", {
    subscriptionId,
    gateway: PAYMENT_GATEWAYS.AIRTEL_MONEY,
    paymentMethod: PAYMENT_METHODS.AIRTEL_MONEY,
    msisdn,
    idempotencyKey,
  });
  return { payment: data?.payment || null, gateway: data?.gateway || null, initiation: data?.initiation || null, reused: Boolean(data?.reused) };
};

export const createNepgPaymentIntent = async ({ subscriptionId, idempotencyKey }) => {
  const { data } = await api.post("/payments", {
    subscriptionId,
    gateway: PAYMENT_GATEWAYS.NEPG,
    paymentMethod: PAYMENT_METHODS.NEPG_CARD,
    idempotencyKey,
  });
  return { payment: data?.payment || null, gateway: data?.gateway || null, initiation: data?.initiation || null, reused: Boolean(data?.reused) };
};

export const createMastercardPaymentIntent = async ({ subscriptionId, idempotencyKey }) => {
  const { data } = await api.post("/payments", {
    subscriptionId,
    gateway: PAYMENT_GATEWAYS.MASTERCARD,
    paymentMethod: PAYMENT_METHODS.MASTERCARD,
    idempotencyKey,
  });
  return { payment: data?.payment || null, gateway: data?.gateway || null, initiation: data?.initiation || null, reused: Boolean(data?.reused) };
};

export const createBankPaymentIntent = async ({ subscriptionId, idempotencyKey }) => {
  const { data } = await api.post("/payments", {
    subscriptionId,
    gateway: PAYMENT_GATEWAYS.BANK,
    paymentMethod: PAYMENT_METHODS.NATIONAL_BANK,
    idempotencyKey,
  });
  return { payment: data?.payment || null, gateway: data?.gateway || null, initiation: data?.initiation || null, reused: Boolean(data?.reused) };
};

export const uploadBankProofOfPayment = async ({ paymentId, file, amountPaid, paymentDate, bankTransactionReference, customerNote }) => {
  const formData = new FormData();
  formData.append("proofOfPayment", file);
  formData.append("amountPaid", String(amountPaid));
  formData.append("paymentDate", paymentDate);
  formData.append("bankTransactionReference", bankTransactionReference || "");
  formData.append("customerNote", customerNote || "");
  const { data } = await api.post(`/payments/${paymentId}/pop`, formData, { headers: { "Content-Type": "multipart/form-data" } });
  return data?.payment || null;
};

export const listPaymentHistory = async () => {
  const { data } = await api.get("/payments/me/history");
  return Array.isArray(data?.payments) ? data.payments : [];
};

export const getPaymentReceipt = async (paymentId) => {
  const { data } = await api.get(`/payments/${paymentId}/receipt`);
  return data?.receipt || null;
};

export const getMyProofOfPaymentBlob = async (paymentId) => {
  const response = await api.get(`/payments/${paymentId}/pop`, { responseType: "blob" });
  return response.data;
};

export const verifyPayment = async (paymentId) => {
  const { data } = await api.post(`/payments/${paymentId}/verify`);
  return { payment: data?.payment || null, subscription: data?.subscription || null, verification: data?.verification || null, reused: Boolean(data?.reused) };
};

export const featureAd = async (adId) => {
  const { data } = await api.put(`/ads/${adId}/feature`);
  return data;
};

export const unfeatureAd = async (adId) => {
  const { data } = await api.delete(`/ads/${adId}/feature`);
  return data;
};

export const getAdForBoost = async (adId) => {
  const { data } = await api.get(`/ads/${adId}`);
  return data?.ad || data || null;
};
