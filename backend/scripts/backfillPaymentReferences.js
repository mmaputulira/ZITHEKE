import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Subscription from "../models/Subscription.js";
import Payment from "../models/Payment.js";
import { createPaymentReference, createReceiptReference, createSubscriptionReference } from "../utils/paymentReferences.js";

dotenv.config();

const run = async () => {
  await connectDB();
  let subscriptionsUpdated = 0;
  let paymentsUpdated = 0;

  const subscriptions = await Subscription.find({ $or: [{ subscriptionReference: { $exists: false } }, { subscriptionReference: "" }] }).populate("planId");
  for (const subscription of subscriptions) {
    subscription.subscriptionReference = createSubscriptionReference(subscription.planId?.slug || "PLAN");
    await subscription.save();
    subscriptionsUpdated += 1;
  }

  const payments = await Payment.find({ $or: [{ paymentReference: { $exists: false } }, { paymentReference: "" }, { receiptReference: { $exists: false } }, { receiptReference: "" }] }).populate({ path: "subscriptionId", populate: { path: "planId" } });
  for (const payment of payments) {
    const slug = payment.subscriptionId?.planId?.slug || "PLAN";
    if (!payment.paymentReference) payment.paymentReference = createPaymentReference(slug);
    if (!payment.receiptReference) payment.receiptReference = createReceiptReference(slug);
    await payment.save();
    paymentsUpdated += 1;
  }

  console.log({ subscriptionsUpdated, paymentsUpdated });
  process.exit(0);
};

run().catch((error) => {
  console.error("Reference backfill failed", error);
  process.exit(1);
});
