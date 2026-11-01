import mongoose from "mongoose";
import Subscription from "../../models/Subscription.js";
import SubscriptionEvent from "../../models/SubscriptionEvent.js";
import Ad from "../../models/Ad.js";
import User from "../../models/User.js";
import { SUBSCRIPTION_STATUSES } from "../../constants/subscriptionStatuses.js";

const buildEventPayload = ({
  subscription,
  user,
  featuredAdsRemoved,
  source,
  reason,
  processedAt,
}) => ({
  subscriptionId: String(subscription._id),
  adId: subscription.adId ? String(subscription.adId) : null,
  userId: String(user._id),
  userUid: String(user.uid || ""),
  source,
  reason,
  previousStatus: SUBSCRIPTION_STATUSES.ACTIVE,
  nextStatus: SUBSCRIPTION_STATUSES.EXPIRED,
  featuredAdsRemoved,
  endDate: subscription.endDate,
  processedAt,
});

const createAuditEvent = async ({
  subscription,
  user,
  featuredAdsRemoved,
  source,
  reason,
  processedAt,
  session,
}) => {
  const normalizedPayload = buildEventPayload({
    subscription,
    user,
    featuredAdsRemoved,
    source,
    reason,
    processedAt,
  });

  await SubscriptionEvent.create(
    [
      {
        subscriptionId: subscription._id,
        userId: user._id,
        paymentId: subscription.paymentId || null,
        eventType: "subscription_auto_expired",
        source,
        rawPayload: {
          subscriptionStatus: subscription.status,
          endDate: subscription.endDate,
          autoDowngraded: true,
        },
        normalizedPayload,
        processedAt,
      },
    ],
    session ? { session } : undefined
  );
};

const expireSubscriptionSafely = async ({
  subscription,
  processedAt,
  source = "manual_admin_sync",
}) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const freshSubscription = await Subscription.findOne({
        _id: subscription._id,
        status: SUBSCRIPTION_STATUSES.ACTIVE,
      }).session(session);

      if (!freshSubscription) {
        result = {
          action: "skipped",
          reason: "already_processed",
          subscriptionId: String(subscription._id),
        };
        return;
      }

      const user = await User.findById(freshSubscription.userId)
        .select("_id uid role")
        .session(session);

      if (!user) {
        result = {
          action: "skipped",
          reason: "user_missing",
          subscriptionId: String(freshSubscription._id),
        };
        return;
      }

      if (user.role === "admin") {
        result = {
          action: "skipped",
          reason: "admin_user_excluded",
          subscriptionId: String(freshSubscription._id),
          userUid: String(user.uid || ""),
        };
        return;
      }

      freshSubscription.status = SUBSCRIPTION_STATUSES.EXPIRED;
      freshSubscription.expiredAt = processedAt;
      freshSubscription.autoDowngraded = true;
      await freshSubscription.save({ session });

      const featureRemoval = freshSubscription.adId
        ? await Ad.updateOne(
            { _id: freshSubscription.adId, ownerUid: user.uid, boostSubscriptionId: freshSubscription._id },
            { $set: { featured: false, boostSubscriptionId: null, boostPaymentId: null, boostStartDate: null, boostEndDate: null } },
            { session }
          )
        : { modifiedCount: 0 };

      const featuredAdsRemoved = Number(featureRemoval.modifiedCount || 0);

      await createAuditEvent({
        subscription: freshSubscription,
        user,
        featuredAdsRemoved,
        source,
        reason: "subscription_end_date_reached",
        processedAt,
        session,
      });

      result = {
        action: "expired",
        subscriptionId: String(freshSubscription._id),
        userUid: String(user.uid || ""),
        featuredAdsRemoved,
      };
    });

    return result;
  } finally {
    await session.endSession();
  }
};

const runExpirySync = async ({
  now = new Date(),
  source = "manual_admin_sync",
  limit = 200,
} = {}) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 200, 1), 1000);

  const expiredCandidates = await Subscription.find({
    status: SUBSCRIPTION_STATUSES.ACTIVE,
    endDate: { $ne: null, $lte: now },
  })
    .sort({ endDate: 1, createdAt: 1 })
    .limit(safeLimit)
    .select("_id userId paymentId adId endDate status");

  const summary = {
    processedAt: now,
    source,
    scanned: expiredCandidates.length,
    expiredCount: 0,
    skippedCount: 0,
    featuredAdsRemoved: 0,
    results: [],
  };

  for (const subscription of expiredCandidates) {
    const result = await expireSubscriptionSafely({
      subscription,
      processedAt: now,
      source,
    });

    summary.results.push(result);

    if (result?.action === "expired") {
      summary.expiredCount += 1;
      summary.featuredAdsRemoved += Number(result.featuredAdsRemoved || 0);
    } else {
      summary.skippedCount += 1;
    }
  }

  return summary;
};

export const expireActiveAdBoostForSale = async ({ adId, ownerUid, now = new Date(), session = null }) => {
  const query = User.findOne({ uid: ownerUid }).select("_id");
  if (session) query.session(session);
  const owner = await query;
  if (!owner) return;
  await Subscription.updateMany({ adId, userId: owner._id, scope: "ad_boost", status: SUBSCRIPTION_STATUSES.ACTIVE }, { $set: { status: SUBSCRIPTION_STATUSES.EXPIRED, expiredAt: now, autoDowngraded: true } }, session ? { session } : {});
};

export default {
  runExpirySync,
};
