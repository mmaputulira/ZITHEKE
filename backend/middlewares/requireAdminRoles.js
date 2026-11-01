export const ADMIN_ROLES = Object.freeze(Object.keys(roleLabels));

export const requireAdminRoles = (...roles) => (req, res, next) => {
  // The central permission policy controls both legacy and newly added staff roles.
  if (req.originalUrl && Array.isArray(req.admin?.permissions)) {
    const permission=permissionForRequest(req);
    if(permission && hasPermission(req.admin,permission))return next();
  } else {
    const current=adminRoles(req.admin), allowed=roles.length?roles:Object.keys(roleLabels);
    if(current.includes("super_admin")||current.some(role=>allowed.includes(role)))return next();
  }
  return res.status(403).json({ success: false, message: "Your admin role does not have permission for this action." });
};
import { adminRoles, hasPermission, permissionForRequest, roleLabels } from "../utils/adminAccess.js";
