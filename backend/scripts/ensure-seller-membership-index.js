import dotenv from "dotenv";
import connectDB from "../config/db.js";
import mongoose from "mongoose";

dotenv.config();

const run = async () => {
  await connectDB();
  const collection = mongoose.connection.collection("subscriptions");

  await collection.createIndex(
    { userId: 1, scope: 1, status: 1 },
    {
      name: "uniq_active_seller_membership",
      unique: true,
      partialFilterExpression: {
        status: "active",
        scope: "seller_membership",
      },
    }
  );

  console.log("Seller membership active-subscription index is ready.");
};

run()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Failed to prepare seller membership index:", error?.message || error);
    try { await mongoose.connection.close(); } catch {}
    process.exit(1);
  });
