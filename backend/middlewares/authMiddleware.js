import { resolvePrincipal } from "../Services/marketplaceIdentity.service.js";
const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "Unauthorized. Token missing." });
  try { req.user = await resolvePrincipal(header.slice(7)); next(); }
  catch (error) { res.status(error.statusCode || 401).json({ success: false, message: error.message || "Invalid session." }); }
};
export default authMiddleware;
