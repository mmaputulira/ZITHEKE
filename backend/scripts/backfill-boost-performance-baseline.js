import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Subscription from "../models/Subscription.js";
import { SUBSCRIPTION_STATUSES } from "../constants/subscriptionStatuses.js";

await connectDB();
const rows = await Subscription.find({
  status: SUBSCRIPTION_STATUSES.ACTIVE,
  scope: "ad_boost",
  "performanceSnapshot.viewsAtStart": null,
}).populate("adId", "views favouritesCount");

let updated = 0;
for (const row of rows) {
  if (!row.adId) continue;
  row.performanceSnapshot = {
    viewsAtStart: Number(row.adId.views || 0),
    savesAtStart: Number(row.adId.favouritesCount || 0),
    capturedAt: new Date(),
  };
  await row.save();
  updated += 1;
}
console.log(`Boost performance baseline created for ${updated} active boost(s).`);
await mongoose.disconnect();
