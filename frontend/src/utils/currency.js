export const digitsOnly = (value = "") => String(value ?? "").replace(/[^0-9]/g, "");

export const parseCurrencyInput = (value = "") => {
  const raw = digitsOnly(value);
  return raw ? Number(raw) : 0;
};

export const formatCurrencyInput = (value = "") => {
  const raw = digitsOnly(value);
  if (!raw) return "";
  return Number(raw).toLocaleString("en-MW");
};

export const formatMWK = (value = 0, prefix = "MWK ") => {
  const amount = Number(value || 0);
  return `${prefix}${Number.isFinite(amount) ? amount.toLocaleString("en-MW") : "0"}`;
};
