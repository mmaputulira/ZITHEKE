import { isActiveBuyer, isActiveMerchant } from "../utils/marketplacePolicy.js";
export const requireBuyer = (req, res, next) => isActiveBuyer(req.user) ? next() : res.status(403).json({ message: "An active buyer account is required for this action." });
export const requireMerchant = (req, res, next) => isActiveMerchant(req.user) ? next() : res.status(403).json({ message: "An active merchant account is required for this action." });
