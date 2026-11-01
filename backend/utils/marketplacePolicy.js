// Existing accounts belong to the seller platform. New buyers are explicit.
export const accountTypeOf = (user) => user?.accountType === "buyer" ? "buyer" : "merchant";
export const isActiveBuyer = (user) => accountTypeOf(user) === "buyer" && user?.status === "Active" && user?.role !== "admin";
export const isActiveMerchant = (user) => accountTypeOf(user) === "merchant" && user?.status === "Active" && (user?.merchantStatus || "active") === "active" && user?.role !== "admin";
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
});
export const policyError = (statusCode, message) => Object.assign(new Error(message), { statusCode });
export const assertAccountAvailable = (user) => {
  if (!user) throw policyError(401, "Account unavailable.");
  if (["Inactive", "Suspended"].includes(user.status)) throw policyError(403, `This account is ${user.status.toLowerCase()}.`);
};
