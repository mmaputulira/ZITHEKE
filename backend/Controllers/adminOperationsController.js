import { adminRoles, permissionsFor, roleLabels, hasPermission } from "../utils/adminAccess.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Admin from "../models/Admin.js";
import AdminAuditLog from "../models/AdminAuditLog.js";
import AdminNotification from "../models/AdminNotification.js";
import User from "../models/User.js";
import Ad from "../models/Ad.js";
import Payment from "../models/Payment.js";
import Subscription from "../models/Subscription.js";
import Plan from "../models/Plan.js";
import Report from "../models/Report.js";
import ContactMessage from "../models/ContactMessage.js";
import Conversation from "../models/Conversation.js";
import Session from "../models/Session.js";
import Offer from "../models/Offer.js";
import SellerFollow from "../models/SellerFollow.js";
import subscriptionService from "../Services/payments/subscription.service.js";
import { eligibleMerchantQuery } from "../Services/publicMerchants.service.js";

const ok = (res, data = {}, status = 200) => res.status(status).json({ success: true, ...data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });
const objectId = (v) => mongoose.Types.ObjectId.isValid(v);
const escapeRe = (s="") => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const parseDate = (v, end=false) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  if (end) d.setHours(23,59,59,999); else d.setHours(0,0,0,0);
  return d;
};

export const getOperationsDashboard = async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const verifiedMatch = { status: "paid", verificationStatus: "verified" };
    const [activeUsers, activeSellers, liveAds, pendingAds, activeBoosts, activeMemberships, pendingPops, openReports, inactiveUsers, todayRevenue, monthRevenue, paymentMethods] = await Promise.all([
      User.countDocuments({ status: "Active" }),
      User.countDocuments(eligibleMerchantQuery),
      Ad.countDocuments({ status: "Approved" }),
      Ad.countDocuments({ status: "Pending" }),
      Subscription.countDocuments({ scope: "ad_boost", status: "active" }),
      Subscription.countDocuments({ scope: "seller_membership", status: "active" }),
      Payment.countDocuments({ verificationStatus: "pending_review" }),
      Report.countDocuments({ status: "Pending" }),
      User.countDocuments({ status: { $in: ["Inactive","Under Review","Suspended"] } }),
      Payment.aggregate([{ $match: { ...verifiedMatch, paidAt: { $gte: todayStart } } }, { $group: { _id:null, total:{ $sum:{ $ifNull:["$paidAmount","$amount"] } } } }]).then(r=>r[0]?.total||0),
      Payment.aggregate([{ $match: { ...verifiedMatch, paidAt: { $gte: monthStart } } }, { $group: { _id:null, total:{ $sum:{ $ifNull:["$paidAmount","$amount"] } } } }]).then(r=>r[0]?.total||0),
      Payment.aggregate([{ $match: verifiedMatch }, { $group: { _id:"$paymentMethod", total:{ $sum:{ $ifNull:["$paidAmount","$amount"] } }, count:{ $sum:1 } } }, { $sort:{ total:-1 } }]),
    ]);
    return ok(res, { data: { activeUsers, activeSellers, liveAds, pendingAds, activeBoosts, activeMemberships, pendingPops, openReports, inactiveUsers, todayRevenue, monthRevenue, paymentMethods } });
  } catch (e) { return fail(res, e.message || "Failed to load operations dashboard", 500); }
};

export const getReconciliation = async (req, res) => {
  try {
    const query = {};
    const from = parseDate(req.query.dateFrom); const to = parseDate(req.query.dateTo, true);
    if (from || to) query.createdAt = { ...(from?{$gte:from}:{}), ...(to?{$lte:to}:{}) };
    if (req.query.paymentMethod) query.paymentMethod = req.query.paymentMethod;
    if (req.query.status) query.status = req.query.status;
    if (req.query.verificationStatus) query.verificationStatus = req.query.verificationStatus;
    if (req.query.purchaseType) query.purchaseType = req.query.purchaseType;
    const limit = Math.min(Math.max(Number(req.query.limit)||500, 1), 2000);
    let rows = await Payment.find(query)
      .populate("userId", "name email phone uid status")
      .populate({ path:"subscriptionId", populate:[{path:"planId"},{path:"adId",select:"title price category status ownerUid"}] })
      .populate("verifiedBy", "email role")
      .sort({ createdAt:-1 }).limit(limit).lean();
    const search = String(req.query.search||"").trim().toLowerCase();
    if (search) rows = rows.filter((p)=>{
      const s=p.subscriptionId||{}, plan=s.planId||{}, ad=s.adId||{}, u=p.userId||{};
      return [p.paymentReference,p.merchantTransactionId,p.gatewayTransactionId,p.bankTransactionReference,s.subscriptionReference,plan.name,ad.title,u.name,u.email,u.phone]
        .some(v=>String(v||"").toLowerCase().includes(search));
    });
    const mapped = rows.map((p)=>{
      const expected=Number(p.amount||0); const claimed=p.paidAmount==null?null:Number(p.paidAmount||0);
      const verified = p.status === "paid" && p.verificationStatus === "verified" ? Number(p.paidAmount ?? p.amount ?? 0) : 0;
      return { ...p, reconciliation: { expectedAmount: expected, claimedAmount: claimed, verifiedAmount: verified, difference: expected - verified } };
    });
    const totals = mapped.reduce((a,p)=>{ a.transactions+=1; a.expected+=p.reconciliation.expectedAmount; a.claimed+=p.reconciliation.claimedAmount||0; a.verified+=p.reconciliation.verifiedAmount; a.difference+=p.reconciliation.difference; if(p.status==="paid"&&p.verificationStatus==="verified")a.verifiedCount+=1; else a.pendingCount+=1; return a; }, {transactions:0,expected:0,claimed:0,verified:0,difference:0,verifiedCount:0,pendingCount:0});
    return ok(res,{ data:mapped, totals });
  } catch(e){ return fail(res,e.message||"Failed to load reconciliation",500); }
};

export const updateUserLifecycle = async (req,res) => {
  try {
    if(!objectId(req.params.id)) return fail(res,"Invalid user ID");
    const allowed=["Active","Inactive","Under Review","Suspended"];
    const status=String(req.body.status||""); if(!allowed.includes(status)) return fail(res,"Invalid lifecycle status");
    const user=await User.findByIdAndUpdate(req.params.id,{ status },{new:true}).select("uid name email phone status verified merchantVerified accountType merchantStatus merchantApplication");
    if(!user) return fail(res,"User not found",404);
    if(["Inactive","Suspended"].includes(status)) { await Session.updateMany({ userUid:user.uid, revokedAt:null },{ $set:{ revokedAt:new Date() } }); req.io?.in(user.uid).disconnectSockets(true); }
    return ok(res,{ user });
  } catch(e){ return fail(res,e.message||"Failed to update user",500); }
};

export const updateVerifiedSeller = async (req,res) => {
  try { if(!objectId(req.params.id)) return fail(res,"Invalid user ID"); const user=await User.findOneAndUpdate({_id:req.params.id,accountType:{$ne:"buyer"}},{ merchantVerified:Boolean(req.body.verified) },{new:true}).select("uid name email status verified"); if(!user)return fail(res,"User not found",404); return ok(res,{user}); } catch(e){return fail(res,e.message||"Failed to update seller verification",500);}
};

export const getSeller360 = async (req,res) => {
  try {
    if(!objectId(req.params.id)) return fail(res,"Invalid user ID");
    const user=await User.findById(req.params.id).select("uid name email phone photoURL location city status accountType merchantStatus merchantVerified merchantApplication createdAt lastLogin").lean(); if(!user)return fail(res,"User not found",404);
    const ads=await Ad.find({ownerUid:user.uid}).select("title price category status featured views favouritesCount boostStartDate boostEndDate createdAt").sort({createdAt:-1}).lean();
    const adIds=ads.map(a=>a._id);
    const [subscriptions,payments,reports,offers,followers,sessions] = await Promise.all([
      Subscription.find({userId:user._id}).populate("planId").populate("adId","title status").sort({createdAt:-1}).lean(),
      Payment.find({userId:user._id}).select("paymentReference merchantTransactionId subscriptionId purchaseType status verificationStatus amount paidAmount currency paymentMethod createdAt paidAt").sort({createdAt:-1}).lean(),
      Report.find({adId:{$in:adIds}}).sort({createdAt:-1}).lean(),
      Offer.find({$or:[{sellerUid:user.uid},{buyerUid:user.uid}]}).populate("adId","title price").sort({createdAt:-1}).limit(100).lean(),
      SellerFollow.countDocuments({sellerUid:user.uid}),
      Session.find({userUid:user.uid}).select("userAgent ip lastUsedAt revokedAt createdAt").sort({createdAt:-1}).limit(20).lean(),
    ]);
    const verifiedSpend=payments.filter(p=>p.status==="paid"&&p.verificationStatus==="verified").reduce((s,p)=>s+Number(p.paidAmount??p.amount??0),0);
    const financial=hasPermission(req.admin,"finance.read")||adminRoles(req.admin).includes("marketplace");
    const investigation=adminRoles(req.admin).some(role=>["super_admin","risk"].includes(role));
    return ok(res,{ data:{ user, ads, subscriptions:financial?subscriptions:[], payments:financial?payments:[], reports:hasPermission(req.admin,"reports.read")?reports:[], offers:hasPermission(req.admin,"orders.read")?offers:[], followers, sessions:investigation?sessions:[], summary:{ totalAds:ads.length, approvedAds:ads.filter(a=>a.status==="Approved").length, activeBoosts:subscriptions.filter(s=>s.scope==="ad_boost"&&s.status==="active").length, activeMemberships:subscriptions.filter(s=>s.scope==="seller_membership"&&s.status==="active").length, verifiedSpend:financial?verifiedSpend:null } } });
  } catch(e){return fail(res,e.message||"Failed to load Seller 360",500);}
};

export const bulkModerateAds = async (req,res) => {
  try {
    const ids=Array.isArray(req.body.ids)?req.body.ids.filter(objectId):[]; if(!ids.length)return fail(res,"Select at least one advert");
    const action=String(req.body.action||""); const reason=String(req.body.reason||"").trim();
    const map={ approve:"Approved", reject:"Rejected", request_changes:"Needs Editing", flag:"Flagged", suspend:"Suspended", archive:"Archived" };
    const status=map[action]; if(!status)return fail(res,"Invalid moderation action");
    if(["reject","request_changes","flag","suspend"].includes(action)&&!reason)return fail(res,"A reason is required for this action");
    const set={status}; if(reason){set.rejectionReason=reason;set.reportReason=reason;}
    const result=await Ad.updateMany({_id:{$in:ids}},{$set:set});
    return ok(res,{ message:`${result.modifiedCount} advert(s) updated`, modifiedCount:result.modifiedCount, status });
  } catch(e){return fail(res,e.message||"Bulk moderation failed",500);}
};

export const getRiskFlags = async (req,res) => {
  try {
    const users=await User.find().select("_id uid name email phone status verified createdAt lastLogin").lean();
    const uidList=users.map(u=>u.uid); const idList=users.map(u=>u._id);
    const [adAgg, reportAgg, payAgg] = await Promise.all([
      Ad.aggregate([{ $match:{ownerUid:{$in:uidList}} },{ $group:{_id:"$ownerUid", totalAds:{$sum:1}, rejectedAds:{$sum:{$cond:[{$in:["$status",["Rejected","Flagged","Suspended"]]},1,0]}}} }]),
      Report.aggregate([{ $group:{_id:"$sellerId", reports:{$sum:1}, pendingReports:{$sum:{$cond:[{$eq:["$status","Pending"]},1,0]}}} }]),
      Payment.aggregate([{ $match:{userId:{$in:idList}} },{ $group:{_id:"$userId", rejectedPayments:{$sum:{$cond:[{$in:["$verificationStatus",["rejected","failed"]]},1,0]}}, totalPayments:{$sum:1}} }]),
    ]);
    const ads=new Map(adAgg.map(x=>[String(x._id),x])); const reports=new Map(reportAgg.map(x=>[String(x._id),x])); const pays=new Map(payAgg.map(x=>[String(x._id),x]));
    const data=users.map(u=>{ const a=ads.get(String(u.uid))||{}; const r=reports.get(String(u.uid))||{}; const p=pays.get(String(u._id))||{}; let score=0; const signals=[]; if(u.status==="Suspended"){score+=50;signals.push("Account suspended");} if(u.status==="Under Review"){score+=25;signals.push("Account under review");} if((r.reports||0)>=2){score+=Math.min(30,(r.reports||0)*5);signals.push(`${r.reports} reported listing incidents`);} if((p.rejectedPayments||0)>=2){score+=Math.min(30,p.rejectedPayments*7);signals.push(`${p.rejectedPayments} rejected/failed payment reviews`);} if((a.rejectedAds||0)>=3){score+=20;signals.push(`${a.rejectedAds} rejected/flagged adverts`);} if((a.totalAds||0)>50){score+=10;signals.push("High advert volume");} const level=score>=50?"High":score>=20?"Medium":"Low"; return {...u,riskScore:score,riskLevel:level,signals,metrics:{...a,...r,...p}}; }).filter(x=>x.riskScore>0).sort((a,b)=>b.riskScore-a.riskScore);
    return ok(res,{data});
  } catch(e){return fail(res,e.message||"Failed to load risk flags",500);}
};

export const getAuditLogs = async (req,res) => {
  try { const q={}; if(req.query.adminRole)q.adminRole=req.query.adminRole; if(req.query.search){const re=new RegExp(escapeRe(req.query.search),"i");q.$or=[{action:re},{adminEmail:re},{targetId:re},{reason:re}];} const logs=await AdminAuditLog.find(q).sort({createdAt:-1}).limit(Math.min(Number(req.query.limit)||300,1000)).lean(); return ok(res,{data:logs}); } catch(e){return fail(res,e.message||"Failed to load audit log",500);}
};

export const getSystemHealth = async (req,res) => {
  try {
    const [pendingPayments,pendingPops,pendingAds,expiredActive] = await Promise.all([
      Payment.countDocuments({status:{$in:["created","initiated","pending","pending_verification","pop_submitted"]}}),
      Payment.countDocuments({verificationStatus:"pending_review"}),
      Ad.countDocuments({status:"Pending"}),
      Subscription.countDocuments({status:"active",endDate:{$lt:new Date()}}),
    ]);
    const configured=(keys)=>keys.every(k=>Boolean(String(process.env[k]||"").trim()));
    return ok(res,{data:{ api:{status:"online"}, mongodb:{status:mongoose.connection.readyState===1?"online":"offline",readyState:mongoose.connection.readyState}, airtelMoney:{status:configured(["AIRTEL_CLIENT_ID","AIRTEL_CLIENT_SECRET"])?"configured":"needs_configuration"}, nationalBank:{status:configured(["BANK_ACCOUNT_NUMBER","BANK_ACCOUNT_NAME"])?"configured":"configured_by_defaults"}, nepg:{status:configured(["NEPG_BASE_URL","NEPG_CLIENT_ID","NEPG_CLIENT_SECRET","NEPG_API_KEY"])?"configured":"needs_configuration"}, mpgs:{status:configured(["MPGS_MERCHANT_ID","MPGS_API_PASSWORD"])?"configured":"needs_configuration"}, cloudinary:{status:configured(["CLOUDINARY_CLOUD_NAME","CLOUDINARY_API_KEY"])?"configured":"needs_configuration"}, workers:{boostExpiry:{status:expiredActive===0?"healthy":"attention",expiredActive}}, queues:{pendingPayments,pendingPops,pendingAds}, checkedAt:new Date() }});
  } catch(e){return fail(res,e.message||"Failed to check system health",500);}
};

export const manualPaymentRecovery = async (req,res) => {
  try {
    if(!objectId(req.params.paymentId))return fail(res,"Invalid payment ID"); const reason=String(req.body.reason||"").trim(); if(!reason)return fail(res,"A recovery reason is required");
    const payment=await Payment.findById(req.params.paymentId).populate("subscriptionId"); if(!payment)return fail(res,"Payment not found",404);
    if(payment.status!=="paid"||payment.verificationStatus!=="verified")return fail(res,"Only already paid and verified transactions can be recovered",409);
    const sub=payment.subscriptionId; if(!sub)return fail(res,"Linked subscription is missing",409);
    const activated=await subscriptionService.activateSubscriptionForVerifiedPayment({subscriptionId:sub._id,paymentId:payment._id});
    return ok(res,{message:"Verified payment recovered and linked service activated",subscription:activated});
  } catch(e){return fail(res,e.message||"Manual recovery failed",e.statusCode||500);}
};

export const listNotifications = async (req,res) => { try{const data=await AdminNotification.find().populate("createdBy","email role").populate("targetUserId","name email").sort({createdAt:-1}).limit(300).lean();return ok(res,{data});}catch(e){return fail(res,e.message||"Failed to load notifications",500);} };
export const createNotification = async (req,res) => { try{const {title,message,audience="all",targetUserId=null,severity="info",expiresAt=null}=req.body||{}; if(!String(title||"").trim()||!String(message||"").trim())return fail(res,"Title and message are required"); if(audience==="user"&&!objectId(targetUserId))return fail(res,"A valid target user is required"); const item=await AdminNotification.create({title:String(title).trim(),message:String(message).trim(),audience,targetUserId:audience==="user"?targetUserId:null,severity,expiresAt:expiresAt?new Date(expiresAt):null,createdBy:req.admin?.id||null}); return ok(res,{data:item},201);}catch(e){return fail(res,e.message||"Failed to publish notification",500);} };
export const toggleNotification = async (req,res) => { try{if(!objectId(req.params.id))return fail(res,"Invalid notification ID"); const item=await AdminNotification.findByIdAndUpdate(req.params.id,{isActive:Boolean(req.body.isActive)},{new:true});if(!item)return fail(res,"Notification not found",404);return ok(res,{data:item});}catch(e){return fail(res,e.message||"Failed to update notification",500);} };

export const listAdminAccess = async (req,res) => { try{const data=await Admin.find().select("email name role roles active createdAt updatedAt").sort({createdAt:1}).lean();return ok(res,{data});}catch(e){return fail(res,e.message||"Failed to load administrators",500);} };
export const updateAdminRole = async (req,res) => {
 try {
  if(!objectId(req.params.id))return fail(res,"Invalid administrator ID");
  const roles=Array.isArray(req.body.roles)?[...new Set(req.body.roles)]:[req.body.role];
  if(!roles.length||roles.some(role=>!Object.hasOwn(roleLabels,role)))return fail(res,"Select valid staff roles");
  if(String(req.params.id)===String(req.admin.id)&&req.admin.roles.includes("super_admin")&&!roles.includes("super_admin"))return fail(res,"You cannot remove your own Super Administrator access",409);
  const current=await Admin.findById(req.params.id);if(!current)return fail(res,"Administrator not found",404);
  if(adminRoles(current).includes("super_admin")&&!roles.includes("super_admin")) {
   const count=await Admin.countDocuments({active:{$ne:false},$or:[{roles:"super_admin"},{roles:{$exists:false},role:"super_admin"}]});
   if(count<=1)return fail(res,"The last active Super Administrator cannot be removed",409);
  }
  current.roles=roles;current.role=roles[0];await current.save();
  return ok(res,{data:{id:current.id,email:current.email,role:current.role,roles,permissions:permissionsFor(current)},message:"Staff roles updated. API permissions take effect immediately."});
 } catch(e){return fail(res,e.message||"Unable to update staff roles",500)}
};

export const getSupportCentre = async (req,res) => {
  try { const [messages,reports]=await Promise.all([ContactMessage.find({trashedAt:null}).sort({createdAt:-1}).limit(200).lean(),Report.find().populate("adId","title status ownerUid").sort({createdAt:-1}).limit(200).lean()]); return ok(res,{data:{messages,reports}});} catch(e){return fail(res,e.message||"Failed to load support centre",500);}
};


export const getOwnAdminProfile = async (req,res) => {
  try {
    const item = await Admin.findById(req.admin?.id).select("email name phone role roles active mustChangePassword createdAt updatedAt").lean();
    if(!item) return fail(res,"Administrator not found",404);
    return ok(res,{data:{...item,roles:adminRoles(item),permissions:item.mustChangePassword?[]:permissionsFor(item)}});
  } catch(e){ return fail(res,e.message||"Failed to load admin profile",500); }
};

export const updateOwnAdminProfile = async (req,res) => {
  try {
    const admin = await Admin.findById(req.admin?.id);
    if(!admin) return fail(res,"Administrator not found",404);
    const name = String(req.body.name ?? admin.name ?? "").trim().slice(0,120);
    const phone = String(req.body.phone ?? admin.phone ?? "").trim().slice(0,40);
    const email = String(req.body.email ?? admin.email ?? "").trim().toLowerCase();
    if(email!==admin.email && !hasPermission(req.admin,"access.manage"))return fail(res,"Only the Super Administrator can change a staff login email. Contact them to update your identity.",403);
    if(!email || !/^\S+@\S+\.\S+$/.test(email)) return fail(res,"Enter a valid email address");
    const duplicate = await Admin.findOne({ email, _id:{ $ne:admin._id } }).select("_id").lean();
    if(duplicate) return fail(res,"Another administrator already uses that email address",409);
    admin.name=name; admin.phone=phone; admin.email=email; await admin.save();
    return ok(res,{data:{id:admin._id,email:admin.email,name:admin.name,phone:admin.phone,role:admin.role},message:"Admin profile updated. If the email changed, use the new email next time you sign in."});
  } catch(e){ return fail(res,e.message||"Failed to update admin profile",500); }
};

export const changeOwnAdminPassword = async (req,res) => {
  try {
    const currentPassword=String(req.body.currentPassword||"");
    const newPassword=String(req.body.newPassword||"");
    if(!currentPassword||!newPassword) return fail(res,"Current and new password are required");
    if(newPassword.length<12 || Buffer.byteLength(newPassword,'utf8')>72) return fail(res,"New password must be at least 12 characters and no more than 72 UTF-8 bytes");
    const admin=await Admin.findById(req.admin?.id);
    if(!admin) return fail(res,"Administrator not found",404);
    const valid=await bcrypt.compare(currentPassword,admin.password);
    if(!valid) return fail(res,"Current password is incorrect",401);
    if(await bcrypt.compare(newPassword,admin.password))return fail(res,"Choose a new password different from your current or temporary password");
    const changed=await Admin.findOneAndUpdate({_id:admin._id,password:admin.password},{$set:{password:await bcrypt.hash(newPassword,12),mustChangePassword:false,passwordChangedAt:new Date()},$inc:{tokenVersion:1}},{new:true});
    if(!changed)return fail(res,"Your password changed during this request. Sign in again.",409);
    return ok(res,{message:"Password changed successfully. Sign in again with the new password."});
  } catch(e){ return fail(res,e.message||"Failed to change password",500); }
};
