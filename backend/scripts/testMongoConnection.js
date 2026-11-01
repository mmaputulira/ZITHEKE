import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";

try {
  await connectDB();
  console.log("MongoDB connection test passed.");
  await mongoose.connection.close();
  process.exit(0);
} catch (error) {
  console.error("MongoDB connection test failed:", error?.message || error);
  process.exit(1);
}
