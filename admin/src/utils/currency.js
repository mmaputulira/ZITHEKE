import { formatAmount } from "./formatPrice.js";

// Keep digits and at most one decimal point with up to two decimals.
export const sanitizeAmount = (value = "") => {
  const cleaned = String(value ?? "").replace(/[^0-9.]/g, "");
  const [whole = "", ...rest] = cleaned.split(".");
  const wholeDigits = whole.replace(/^0+(?=\d)/, "");
  if (!rest.length) return wholeDigits;
  return `${wholeDigits || "0"}.${rest.join("").slice(0, 2)}`;
};

// Legacy helper kept for callers that only want whole numbers.
export const digitsOnly = (value = "") => String(value ?? "").replace(/[^0-9]/g, "");

export const parseCurrencyInput = (value = "") => {
  const raw = sanitizeAmount(value);
  const amount = raw ? Number(raw) : 0;
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : 0;
};

// While typing: 200000 -> "200,000", 1500.5 -> "1,500.5". Keeps what the
// person typed after the decimal point so the cursor never fights them.
export const formatCurrencyInput = (value = "") => {
  const raw = sanitizeAmount(value);
  if (!raw) return "";
  const [whole, decimals] = raw.split(".");
  const grouped = Number(whole || 0).toLocaleString("en-US");
  return decimals === undefined ? grouped : `${grouped}.${decimals}`;
};

// After typing (on blur) and everywhere amounts are shown: "200,000.00".
export const formatCurrencyFinal = (value = "") => {
  const raw = sanitizeAmount(value);
  return raw ? formatAmount(raw) : "";
};

export const formatMWK = (value = 0, prefix = "MWK ") => `${prefix}${formatAmount(value || 0)}`;

// Admin name for the same formatter.
export const formatMoney = (value = 0, prefix = "MWK ") => `${prefix}${formatAmount(value || 0)}`;
