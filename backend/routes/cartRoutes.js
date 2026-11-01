import express from "express";
import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Ad from "../models/Ad.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { requireBuyer } from "../middlewares/marketplaceAuth.js";
import { isPurchasable } from "../utils/marketplacePolicy.js";
import { assertMerchantUid } from "../Services/marketplaceIdentity.service.js";
import { createPurchaseRequest } from "../Services/orders.service.js";
const router = express.Router();
router.use(authMiddleware, requireBuyer);
router.get("/", async (req,res) => {
  const cart = await Cart.findOne({ buyerUid:req.user.uid }).populate("items");
  const items = await Promise.all((cart?.items || []).filter(Boolean).map(async ad => {
    let available = isPurchasable(ad) && !ad.reservedOrderId;
    try { await assertMerchantUid(ad.ownerUid); } catch { available = false; }
    return { ...ad.toObject(), available };
  }));
  res.json({ items });
});
router.post("/items", async (req,res) => {
  if (!mongoose.Types.ObjectId.isValid(req.body.adId)) return res.status(400).json({ message:"Invalid listing." });
  const ad = await Ad.findById(req.body.adId);
  if (!isPurchasable(ad) || ad.reservedOrderId || ad.ownerUid === req.user.uid) return res.status(409).json({ message:"This listing cannot be added to cart." });
  try { await assertMerchantUid(ad.ownerUid); } catch(error) { return res.status(error.statusCode || 500).json({ message:error.message }); }
  // Bounded update is atomic, including concurrent adds. The cart represents single-item listings.
  try { await Cart.updateOne({ buyerUid:req.user.uid }, { $setOnInsert:{items:[]} }, { upsert:true }); } catch(error) { if(error.code!==11000) throw error; }
  const result = await Cart.updateOne({ buyerUid:req.user.uid, $expr:{ $lt:[{ $size:"$items" },50] } }, { $addToSet:{ items:ad._id } });
  if (!result.matchedCount) return res.status(409).json({ message:"Your cart is full. Send your current requests first." });
  res.json({ message:"Added to cart." });
});
router.delete("/items/:adId", async (req,res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.adId)) return res.status(400).json({ message:"Invalid listing." });
  await Cart.updateOne({ buyerUid:req.user.uid }, { $pull:{items:req.params.adId} }); res.json({ success:true });
});
router.post("/requests", async (req,res) => {
  const cart = await Cart.findOne({ buyerUid:req.user.uid });
  if (!cart?.items?.length) return res.status(409).json({ message:"Your cart is empty." });
  const orders = [], failed = [];
  for (const adId of cart.items) {
    try {
      const result = await createPurchaseRequest({ buyer:req.user, adId, note:req.body.note });
      orders.push(result.order);
      await Cart.updateOne({ buyerUid:req.user.uid }, { $pull:{items:adId} });
    } catch(error) { failed.push({ adId, message:error.statusCode ? error.message : "Unable to send this request. Please retry." }); }
  }
  res.status(orders.length ? 200 : 409).json({ orders, failed, message:"Each listing creates a separate request to its merchant. Payment is arranged directly." });
});
export default router;
