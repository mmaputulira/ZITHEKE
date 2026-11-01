import { isActiveMerchant } from "../../utils/marketplacePolicy.js";
import mongoose from "mongoose";
import User from "../../models/User.js";
import Subscription from "../../models/Subscription.js";
import Plan from "../../models/Plan.js";
import Ad from "../../models/Ad.js";
import { SUBSCRIPTION_STATUSES } from "../../constants/subscriptionStatuses.js";
import { MEMBERSHIP_PLANS } from "../../constants/membershipPlans.js";
import { createSubscriptionReference } from "../../utils/paymentReferences.js";

const SUBSCRIPTION_SCOPES = Object.freeze({
  AD_BOOST: "ad_boost",
  SELLER_MEMBERSHIP: "seller_membership",
});

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const assertObjectId = (value, label) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw createError(400, `Invalid ${label}`);
  }
};

const resolveUserByUid = async (userUid) => {
  const user = await User.findOne({ uid: userUid }).select("_id uid email name status role accountType merchantStatus");
  if (!user) throw createError(404, "Authenticated user not found");
  return user;
};

const resolveActivePlan = async (planId) => {
  assertObjectId(planId, "planId");
  const plan = await Plan.findOne({ _id: planId, isActive: true });
  if (!plan) throw createError(404, "Plan not found or inactive");
  return plan;
};

const resolveOwnedAd = async (adId, userUid) => {
  assertObjectId(adId, "adId");
  const ad = await Ad.findOne({
    _id: adId,
    ownerUid: userUid,
    status: "Approved",
  }).select(
    "_id title price currency images featured boostEndDate ownerUid status views favouritesCount"
  );
  if (!ad) {
    throw createError(404, "Advert not found or does not belong to this seller");
  }
  return ad;
};

const normalizeScope = (scope) =>
  scope === SUBSCRIPTION_SCOPES.SELLER_MEMBERSHIP
    ? SUBSCRIPTION_SCOPES.SELLER_MEMBERSHIP
    : SUBSCRIPTION_SCOPES.AD_BOOST;

const hydrateSubscription = (id, session = null) => {
  const query = Subscription.findById(id)
    .populate("planId")
    .populate("paymentId")
    .populate("adId");
  if (session) query.session(session);
  return query;
};

const createPendingSubscription = async ({
  userUid,
  planId,
  adId = null,
  scope = SUBSCRIPTION_SCOPES.AD_BOOST,
}) => {
  const user = await resolveUserByUid(userUid);
  if (!isActiveMerchant(user)) throw createError(403, "An active merchant account is required.");
  const plan = await resolveActivePlan(planId);
  const normalizedScope = normalizeScope(scope);

  if (plan.slug === MEMBERSHIP_PLANS.FREE) {
    throw createError(409, "FREE plan does not require a payment");
  }

  if (normalizedScope === SUBSCRIPTION_SCOPES.SELLER_MEMBERSHIP) {
    const activeMembership = await Subscription.findOne({
      userId: user._id,
      scope: SUBSCRIPTION_SCOPES.SELLER_MEMBERSHIP,
      status: SUBSCRIPTION_STATUSES.ACTIVE,
    })
      .populate("planId")
      .populate("paymentId")
      .sort({ endDate: -1 });

    if (activeMembership) {
      throw createError(
        409,
        `Your ${activeMembership.planId?.name || "seller"} plan is already active until ${
          activeMembership.endDate
            ? new Date(activeMembership.endDate).toLocaleDateString("en-GB")
            : "its expiry date"
        }.`
      );
    }

    const pendingMembership = await Subscription.findOne({
      userId: user._id,
      scope: SUBSCRIPTION_SCOPES.SELLER_MEMBERSHIP,
      planId: plan._id,
      status: SUBSCRIPTION_STATUSES.PENDING,
    })
      .populate("planId")
      .populate("paymentId")
      .sort({ createdAt: -1 });

    if (pendingMembership) {
      if (!pendingMembership.subscriptionReference) {
        pendingMembership.subscriptionReference = createSubscriptionReference(plan.slug);
        await pendingMembership.save();
      }
      return pendingMembership;
    }

    const membership = await Subscription.create({
      userId: user._id,
      planId: plan._id,
      adId: null,
      scope: SUBSCRIPTION_SCOPES.SELLER_MEMBERSHIP,
      subscriptionReference: createSubscriptionReference(plan.slug),
      status: SUBSCRIPTION_STATUSES.PENDING,
    });

    return hydrateSubscription(membership._id);
  }

  const ad = await resolveOwnedAd(adId, userUid);

  const activeBoost = await Subscription.findOne({
    userId: user._id,
    adId: ad._id,
    scope: SUBSCRIPTION_SCOPES.AD_BOOST,
    status: SUBSCRIPTION_STATUSES.ACTIVE,
  })
    .populate("planId")
    .populate("paymentId")
    .populate("adId");

  if (activeBoost) {
    throw createError(409, "This advert already has an active boost");
  }

  const pendingBoost = await Subscription.findOne({
    userId: user._id,
    adId: ad._id,
    planId: plan._id,
    scope: SUBSCRIPTION_SCOPES.AD_BOOST,
    status: SUBSCRIPTION_STATUSES.PENDING,
  })
    .populate("planId")
    .populate("paymentId")
    .populate("adId")
    .sort({ createdAt: -1 });

  if (pendingBoost) {
    if (!pendingBoost.subscriptionReference) {
      pendingBoost.subscriptionReference = createSubscriptionReference(plan.slug);
      await pendingBoost.save();
    }
    return pendingBoost;
  }

  const boost = await Subscription.create({
    userId: user._id,
    planId: plan._id,
    adId: ad._id,
    scope: SUBSCRIPTION_SCOPES.AD_BOOST,
    subscriptionReference: createSubscriptionReference(plan.slug),
    status: SUBSCRIPTION_STATUSES.PENDING,
  });

  return hydrateSubscription(boost._id);
};

const getCurrentSubscriptionForUser = async (userUid) => {
  const user = await resolveUserByUid(userUid);
  return Subscription.findOne({
    userId: user._id,
    scope: SUBSCRIPTION_SCOPES.SELLER_MEMBERSHIP,
    status: { $in: [SUBSCRIPTION_STATUSES.ACTIVE, SUBSCRIPTION_STATUSES.PENDING] },
  })
    .populate("planId")
    .populate("paymentId")
    .sort({ createdAt: -1 });
};

const listSubscriptionsForUser = async (userUid) => {
  const user = await resolveUserByUid(userUid);
  return Subscription.find({ userId: user._id })
    .populate("planId")
    .populate("paymentId")
    .populate("adId")
    .sort({ createdAt: -1 });
};

const linkPaymentToSubscription = async ({ subscriptionId, paymentId }) => {
  assertObjectId(subscriptionId, "subscriptionId");
  assertObjectId(paymentId, "paymentId");
  return Subscription.findByIdAndUpdate(subscriptionId, { paymentId }, { new: true });
};

const activateSubscriptionForVerifiedPayment = async ({
  subscriptionId,
  paymentId,
  session = null,
}) => {
  assertObjectId(subscriptionId, "subscriptionId");
  assertObjectId(paymentId, "paymentId");

  const sub = await hydrateSubscription(subscriptionId, session);
  if (!sub) throw createError(404, "Subscription not found");
  if (!sub.planId) throw createError(409, "Subscription plan is missing");

  const scope = normalizeScope(sub.scope);

  if (sub.status === SUBSCRIPTION_STATUSES.ACTIVE) {
    if (String(sub.paymentId?._id || sub.paymentId || "") === String(paymentId)) {
      return sub;
    }
    throw createError(
      409,
      scope === SUBSCRIPTION_SCOPES.AD_BOOST
        ? "This advert boost has already been activated by another verified payment"
        : "This seller membership has already been activated by another verified payment"
    );
  }

  const ownerQuery = User.findById(sub.userId).select("uid status role accountType merchantStatus");
  if (session) ownerQuery.session(session);
  const owner = await ownerQuery;
  if (!owner) throw createError(404, "Subscription owner not found");
  if (!isActiveMerchant(owner)) throw createError(403, "Only active merchants can activate advertising.");

  const now = new Date();
  const days = Number(sub.planId.durationDays || 0);
  const endDate = new Date(now.getTime() + Math.max(days, 0) * 86400000);

  if (scope === SUBSCRIPTION_SCOPES.SELLER_MEMBERSHIP) {
    const conflictQuery = Subscription.findOne({
      userId: sub.userId,
      scope: SUBSCRIPTION_SCOPES.SELLER_MEMBERSHIP,
      status: SUBSCRIPTION_STATUSES.ACTIVE,
      _id: { $ne: sub._id },
    });
    if (session) conflictQuery.session(session);
    if (await conflictQuery) {
      throw createError(409, "This seller already has an active account subscription");
    }

    if (!sub.subscriptionReference) {
      sub.subscriptionReference = createSubscriptionReference(sub.planId.slug);
    }
    sub.status = SUBSCRIPTION_STATUSES.ACTIVE;
    sub.startDate = sub.startDate || now;
    sub.activatedAt = sub.activatedAt || now;
    sub.endDate = endDate;
    sub.expiredAt = null;
    sub.autoDowngraded = false;
    sub.paymentId = paymentId;
    await sub.save(session ? { session } : undefined);
    return hydrateSubscription(sub._id, session);
  }

  if (!sub.adId) {
    throw createError(409, "Boost subscription is not linked to an advert");
  }
  if (String(sub.adId.ownerUid || "") !== String(owner.uid || "")) {
    throw createError(409, "The advert is no longer owned by the subscription user");
  }
  if (String(sub.adId.status || "") !== "Approved") {
    throw createError(409, "Only approved, active adverts can be boosted");
  }

  const conflictQuery = Subscription.findOne({
    userId: sub.userId,
    adId: sub.adId._id || sub.adId,
    scope: SUBSCRIPTION_SCOPES.AD_BOOST,
    status: SUBSCRIPTION_STATUSES.ACTIVE,
    _id: { $ne: sub._id },
  });
  if (session) conflictQuery.session(session);
  if (await conflictQuery) {
    throw createError(409, "This advert already has another active boost");
  }

  if (!sub.subscriptionReference) {
    sub.subscriptionReference = createSubscriptionReference(sub.planId.slug);
  }
  sub.status = SUBSCRIPTION_STATUSES.ACTIVE;
  sub.startDate = sub.startDate || now;
  sub.activatedAt = sub.activatedAt || now;
  sub.endDate = endDate;
  sub.expiredAt = null;
  sub.autoDowngraded = false;
  sub.paymentId = paymentId;
  if (sub.performanceSnapshot?.viewsAtStart == null) {
    sub.performanceSnapshot = {
      viewsAtStart: Number(sub.adId.views || 0),
      savesAtStart: Number(sub.adId.favouritesCount || 0),
      capturedAt: now,
    };
  }
  await sub.save(session ? { session } : undefined);

  const adUpdate = {
    featured: true,
    boostSubscriptionId: sub._id,
    boostPaymentId: paymentId,
    boostStartDate: sub.startDate,
    boostEndDate: endDate,
  };
  const adQuery = Ad.findOneAndUpdate(
    { _id: sub.adId._id || sub.adId },
    { $set: adUpdate },
    { new: true }
  );
  if (session) adQuery.session(session);
  const updatedAd = await adQuery;
  if (!updatedAd) throw createError(409, "The linked advert is no longer available");

  return hydrateSubscription(sub._id, session);
};

export default {
  createPendingSubscription,
  getCurrentSubscriptionForUser,
  listSubscriptionsForUser,
  linkPaymentToSubscription,
  activateSubscriptionForVerifiedPayment,
};
