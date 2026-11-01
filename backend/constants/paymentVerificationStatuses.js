export const PAYMENT_VERIFICATION_STATUSES = Object.freeze({
  UNVERIFIED: "unverified",
  PENDING: "pending",
  PENDING_VERIFICATION: "pending_verification",
  PENDING_REVIEW: "pending_review",
  VERIFIED: "verified",
  REJECTED: "rejected",
  FAILED: "failed",
  EXPIRED: "expired",
  GATEWAY_CONFIGURATION_ERROR: "gateway_configuration_error",
});

export const PAYMENT_VERIFICATION_STATUS_VALUES = Object.freeze(
  Object.values(PAYMENT_VERIFICATION_STATUSES)
);
