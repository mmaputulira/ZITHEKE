import { adminRoles, permissionsFor, permissionForRequest, hasPermission } from "../utils/adminAccess.js";
import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const adminAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Token missing.",
    });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (decoded?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden.",
      });
    }

    const admin = await Admin.findById(decoded.id).select("role roles email active mustChangePassword tokenVersion").lean();
    if (!admin || admin.active === false) return res.status(401).json({ message:"Administrator unavailable." });
    if(Number(decoded.tokenVersion||0)!==Number(admin.tokenVersion||0))return res.status(401).json({message:"Please sign in again. Your session has expired."});
    const ownPasswordRoute=/^\/api\/admin\/ops\/me\/password$/.test(req.originalUrl.split('?')[0]) && req.method==='PATCH';
    const ownProfileRoute=/^\/api\/admin\/ops\/me\/profile$/.test(req.originalUrl.split('?')[0]) && req.method==='GET';
    if(admin.mustChangePassword && !ownPasswordRoute && !ownProfileRoute)return res.status(403).json({code:"PASSWORD_CHANGE_REQUIRED",message:"Change your temporary password before accessing Administration."});
    if(decoded.purpose==='password_change' && !admin.mustChangePassword)return res.status(401).json({message:"Please sign in with your new password."});
    req.admin = { ...decoded, adminRole: admin.role, roles: adminRoles(admin), permissions: permissionsFor(admin), email: admin.email };
    const permission = permissionForRequest(req);
    if (!permission || !hasPermission(admin, permission)) return res.status(403).json({message:"Your staff roles do not permit this action."});
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

export default adminAuthMiddleware;
