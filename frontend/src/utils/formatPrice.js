// src/utils/formatPrice.js
// One money format across Zitheke: comma thousands and two decimals,
// e.g. 200000 -> "200,000.00". Fixed to en-US grouping so every browser and
// phone shows the same thing (some locales would show 200.000,00 or 2,00,000).
const amountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amountFormatter.format(amount) : "0.00";
};

export const formatPrice = (price, currency = "MK") => {
  const prefix = String(currency || "").trim();
  if (price === null || price === undefined || price === "" || isNaN(price)) return `${prefix} —`.trim();
  return `${prefix} ${formatAmount(price)}`.trim();
};
