import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import "../models/Plan.js";

const main = async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000 });

  const now = new Date();
  await User.updateMany(
    { sellerProfileBoostActive: true },
    {
      $set: {
        sellerProfileBoostActive: false,
        sellerProfileBoostSubscriptionId: null,
        sellerProfileBoostPlanSlug: "",
        sellerProfileBoostPlanName: "",
        sellerProfileBoostPriority: 0,
        sellerProfileBoostStartDate: null,
        sellerProfileBoostEndDate: null,
      },
    }
  );

  const activeMemberships = await Subscription.find({
    scope: "seller_membership",
    status: "active",
    endDate: { $gt: now },
  }).populate("planId");

  let updated = 0;
  for (const sub of activeMemberships) {
    if (!sub.planId) continue;
    const result = await User.updateOne(
      { _id: sub.userId },
      {
        $set: {
          sellerProfileBoostActive: true,
          sellerProfileBoostSubscriptionId: sub._id,
          sellerProfileBoostPlanSlug: String(sub.planId.slug || ""),
          sellerProfileBoostPlanName: String(sub.planId.name || "Seller Plan"),
          sellerProfileBoostPriority: Number(sub.planId.priorityLevel || 0),
          sellerProfileBoostStartDate: sub.startDate || sub.activatedAt || now,
          sellerProfileBoostEndDate: sub.endDate,
        },
      }
    );
    updated += Number(result.modifiedCount || 0);
  }

  console.log(`Seller profile boost sync complete. Active memberships: ${activeMemberships.length}; users updated: ${updated}`);
  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error("Seller profile boost sync failed:", error?.message || error);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
