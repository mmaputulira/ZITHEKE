// One account per person. Every active account can buy. `accountType`
// records whether selling has been switched on: "merchant" accounts can also
// sell, "buyer" accounts only buy until they start selling. Existing accounts
// without the field are sellers.
export const accountTypeOf = (user) => user?.accountType === "buyer" ? "buyer" : "merchant";
export const isActiveBuyer = (user) => Boolean(user) && user?.status === "Active" && user?.role !== "admin";
export const isActiveMerchant = (user) => accountTypeOf(user) === "merchant" && user?.status === "Active" && (user?.merchantStatus || "active") === "active" && user?.role !== "admin";
// A buy-only account can switch selling on itself, unless staff have
// rejected or suspended its selling.
export const canStartSelling = (user) => accountTypeOf(user) === "buyer" && user?.status === "Active" && user?.role !== "admin" && !["rejected", "suspended"].includes(user?.merchantStatus);
export const normalizeCurrency = (currency = "MWK") => String(currency).toUpperCase() === "MK" ? "MWK" : String(currency).toUpperCase();
export const isPurchasable = (ad) => ad?.status === "Approved" && Number.isFinite(Number(ad.price)) && Number(ad.price) > 0 && !/job|service|real.?estate|education/.test(String(ad?.category || "").toLowerCase());
export const publicAccount = (user) => ({
  uid: user.uid, name: user.name, email: user.email, phone: user.phone || "",
  photoURL: user.photoURL || "", location: user.location || "", city: user.city || "",
  role: user.role, status: user.status, accountType: accountTypeOf(user),
  merchantStatus: user.merchantStatus || "active", merchantVerified: Boolean(user.merchantVerified),
  merchantApplication: user.merchantApplication || null,
  emailVerified: Boolean(user.emailVerified), phoneVerified: Boolean(user.phoneVerified),
  canSell: isActiveMerchant(user), canBuy: isActiveBuyer(user),
  canStartSelling: canStartSelling(user),
});
export const policyError = (statusCode, message) => Object.assign(new Error(message), { statusCode });
export const assertAccountAvailable = (user) => {
  if (!user) throw policyError(401, "Account unavailable.");
  if (["Inactive", "Suspended"].includes(user.status)) throw policyError(403, `This account is ${user.status.toLowerCase()}.`);
};
