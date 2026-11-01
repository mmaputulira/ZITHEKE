import crypto from "crypto";

const cleanPlan = (value = "PLAN") =>
  String(value || "PLAN")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8) || "PLAN";

const dateStamp = (date = new Date()) => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
};

const randomCode = (length = 5) =>
  crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length).toUpperCase();

export const createPaymentReference = (planSlug) =>
  `ZTH-${cleanPlan(planSlug)}-${dateStamp()}-${randomCode(5)}`;

export const createSubscriptionReference = (planSlug) =>
  `ZTH-SUB-${cleanPlan(planSlug)}-${dateStamp()}-${randomCode(6)}`;

export const createReceiptReference = (planSlug) =>
  `ZTH-RCP-${cleanPlan(planSlug)}-${dateStamp()}-${randomCode(6)}`;
