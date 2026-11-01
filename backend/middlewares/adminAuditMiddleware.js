import AdminAuditLog from "../models/AdminAuditLog.js";

const isSensitiveKey = (key = "") => /password|passcode|pin|token|secret|api[_-]?key|authorization|card(number)?|cvv|cvc|raw(request|response|verification)/i.test(String(key));

const sanitize = (value, depth = 0) => {
  if (depth > 3) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => sanitize(v, depth + 1));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 50)
      .map(([k, v]) => [k, isSensitiveKey(k) ? "[redacted]" : sanitize(v, depth + 1)])
  );
};

export default function adminAuditMiddleware(req, res, next) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  const started = Date.now();
  res.on("finish", () => {
    const parts = String(req.path || "").split("/").filter(Boolean);
    const targetId = parts.find((part) => /^[a-f0-9]{24}$/i.test(part)) || "";
    AdminAuditLog.create({
      adminId: req.admin?.id || null,
      adminEmail: req.admin?.email || "",
      adminRole: req.admin?.adminRole || "admin",
      action: `${req.method} ${req.path}`,
      method: req.method,
      path: req.originalUrl || req.path,
      targetType: parts[0] || "admin",
      targetId,
      reason: String(req.body?.reason || req.body?.note || req.body?.rejectionReason || "").slice(0, 1000),
      statusCode: res.statusCode,
      ip: req.ip || "",
      metadata: { body: sanitize(req.body), staffRoles: req.admin?.roles || [], durationMs: Date.now() - started },
    }).catch((e) => console.error("Admin audit write failed:", e?.message || e));
  });
  next();
}
