import fs from "node:fs";
const policy = JSON.parse(fs.readFileSync(new URL("../constants/adminAccess.json",import.meta.url),"utf8"));
export const roleLabels=policy.labels;
export const adminRoles=admin=>{
  const source=Array.isArray(admin?.roles)?admin.roles:[admin?.adminRole||admin?.role];
  return [...new Set(source)].filter(role=>Object.hasOwn(roleLabels,role));
};
export const permissionsFor=admin=>{
  const roles=adminRoles(admin);
  return Object.keys(policy.permissions).filter(permission=>roles.includes("super_admin")||policy.permissions[permission].some(role=>roles.includes(role)));
};
export const hasPermission=(admin,permission)=>permissionsFor(admin).includes(permission);

// Every protected Admin URL is classified here. Unknown routes fail closed.
export const permissionForRequest=req=>{
  const url=String(req.originalUrl||req.url||"").split("?")[0].replace(/^\/api\/admin/,"");
  const read=["GET","HEAD"].includes(req.method);
  if(/^\/ops\/me\/(profile|password)$/.test(url))return "settings.own";
  if(/^\/ops\/admin-access(?:\/[^/]+\/role)?$/.test(url))return "access.manage";
  if(/\/purge$/.test(url))return "data.purge";
  if(/^\/(ops\/dashboard|overview)$/.test(url))return read?"dashboard.read":null;
  if(/^\/ops\/reconciliation$/.test(url))return read?"finance.read":null;
  if(/^\/ops\/payments\/[^/]+\/recover$/.test(url))return "finance.recover";
  if(/^\/subscription-analytics(?:\/|$)/.test(url))return read?"finance.read":"finance.recover";
  if(/^\/subscriptions\/expiry-sync$/.test(url))return "finance.recover";
  if(/^\/payments\//.test(url))return read?"verification.read":"verification.write";
  if(/^\/plans(?:\/|$)/.test(url))return read?"plans.read":"plans.write";
  if(/^\/ops\/orders$/.test(url))return read?"orders.read":null;
  if(/^\/(?:ops\/)?users(?:\/|$)/.test(url))return read?"accounts.read":"accounts.write";
  if(/^\/ops\/ads\/bulk$/.test(url))return "ads.moderate";
  if(/^\/ads(?:\/|$)/.test(url))return read?"ads.read":/\/(approve|reject)$/.test(url)?"ads.moderate":"ads.write";
  if(/^\/site\/footer$/.test(url))return read?"site.read":"site.write";
  if(/^\/categories(?:\/|$)/.test(url))return read?"categories.read":"categories.write";
  if(/^\/reports(?:\/|$)/.test(url))return read?"reports.read":/\/delete-ad$/.test(url)?"ads.moderate":"reports.write";
  if(/^\/(?:conversations|messages)(?:\/|$)/.test(url))return read?"messages.read":"messages.write";
  if(/^\/contact\/messages(?:\/|$)/.test(url))return read?"support.read":"messages.write";
  if(/^\/ops\/support$/.test(url))return read?"support.read":null;
  if(/^\/ops\/notifications(?:\/|$)/.test(url))return read?"notifications.read":"notifications.write";
  if(/^\/ops\/risk-flags$/.test(url))return read?"risk.read":null;
  if(/^\/ops\/audit-log$/.test(url))return read?"audit.read":null;
  if(/^\/ops\/system-health$/.test(url))return read?"system.read":null;
  return null;
};
