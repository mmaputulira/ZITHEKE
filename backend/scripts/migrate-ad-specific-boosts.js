import mongoose from "mongoose";
import connectDB from "../config/db.js";

const run = async () => {
  await connectDB();
  const collection = mongoose.connection.collection("subscriptions");
  const indexes = await collection.indexes();
  for (const index of indexes) {
    const key = index.key || {};
    if (key.userId === 1 && key.status === 1 && Object.keys(key).length === 2 && index.unique) {
      console.log(`Dropping legacy account-wide active subscription index: ${index.name}`);
      await collection.dropIndex(index.name);
    }
  }
  await collection.createIndex(
    { userId: 1, adId: 1, status: 1 },
    { unique: true, partialFilterExpression: { status: "active", adId: { $type: "objectId" } }, name: "user_ad_active_boost_unique" }
  );
  console.log("Advert-specific boost index is ready.");
  await mongoose.connection.close();
};
run().catch(async (err) => { console.error(err); try { await mongoose.connection.close(); } catch {} process.exit(1); });
